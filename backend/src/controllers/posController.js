// ============================================================
// CANCHA PRO — POS Cafetería, Inventario & "Cargar a Cancha X"
// ============================================================
const db = require('../config/database');

// Listar productos disponibles para la sede
const listProducts = async (req, res, next) => {
  try {
    const venueId = req.query.venue_id || (req.user ? req.user.venue_id : null) || 'a0000000-0000-0000-0000-000000000001';
    const products = await db.findPosProducts(venueId);
    const categories = await db.findPosCategories(venueId);
    res.json({ success: true, categories, products });
  } catch (err) {
    next(err);
  }
};

// Crear nuevo producto o reabastecer stock (TENANT_ADMIN o STAFF)
const createProduct = async (req, res, next) => {
  try {
    const { name, category_id, cost_price, sale_price, stock_quantity, min_stock_alert } = req.body;
    const venueId = req.body.venue_id || (req.user ? req.user.venue_id : 'a0000000-0000-0000-0000-000000000001');

    if (!name || !sale_price) {
      return res.status(400).json({ success: false, error: 'Nombre y precio de venta son requeridos.' });
    }

    const newProd = {
      id: db.generateId(),
      venue_id: venueId,
      category_id: category_id || null,
      name,
      cost_price: Number(cost_price || 0),
      sale_price: Number(sale_price),
      stock_quantity: Number(stock_quantity || 0),
      min_stock_alert: Number(min_stock_alert || 5),
      is_active: true
    };

    db.store.pos_products.push(newProd);
    res.status(201).json({ success: true, product: newProd });
  } catch (err) {
    next(err);
  }
};

// Procesar Venta / Orden de Cafetería (con opción de "Cargar a Cancha X")
const createOrder = async (req, res, next) => {
  try {
    const { items, payment_method, reservation_id, notes } = req.body;
    const venueId = req.body.venue_id || (req.user ? req.user.venue_id : 'a0000000-0000-0000-0000-000000000001');
    const staffId = req.user ? req.user.id : 'u0000000-0000-0000-0000-000000000003';

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'La orden debe contener al menos un producto.' });
    }

    let calculatedTotal = 0;
    const orderItemsProcessed = [];

    // Validar y descontar inventario
    for (const item of items) {
      const product = await db.findPosProductById(item.product_id);
      if (!product) {
        return res.status(404).json({ success: false, error: `Producto con ID ${item.product_id} no existe.` });
      }

      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock_quantity}, Solicitado: ${item.quantity}`
        });
      }

      // Descontar inventario
      product.stock_quantity -= item.quantity;

      const subtotal = product.sale_price * item.quantity;
      calculatedTotal += subtotal;

      orderItemsProcessed.push({
        product_id: product.id,
        name: product.name,
        quantity: item.quantity,
        unit_price: product.sale_price,
        subtotal
      });
    }

    // Si se selecciona "Cargar a Cancha X", vincular a la reserva activa
    let targetReservation = null;
    if (payment_method === 'charged_to_field' || reservation_id) {
      targetReservation = await db.findReservationById(reservation_id);
      if (targetReservation) {
        // Se suma a la cuenta total y saldo pendiente de la reserva
        await db.updateReservation(targetReservation.id, {
          total_amount: targetReservation.total_amount + calculatedTotal,
          remaining_balance: targetReservation.remaining_balance + calculatedTotal,
          notes: (targetReservation.notes ? targetReservation.notes + ' | ' : '') +
                 `Consumos Cafetería agregados: +$${calculatedTotal.toLocaleString('es-CO')}`
        });
      }
    }

    const order = await db.createPosOrder({
      venue_id: venueId,
      reservation_id: reservation_id || null,
      staff_user_id: staffId,
      total_amount: calculatedTotal,
      status: payment_method === 'charged_to_field' ? 'open' : 'paid',
      payment_method: payment_method || 'cash',
      paid_at: payment_method === 'charged_to_field' ? null : new Date().toISOString(),
      items: orderItemsProcessed,
      notes: notes || (targetReservation ? `Cargado a la cuenta de ${targetReservation.client_name}` : '')
    });

    // Actualizar ventas en el turno de caja activo si fue en efectivo
    const activeShift = await db.findActiveShift(venueId);
    if (activeShift) {
      if (payment_method === 'cash') {
        activeShift.expected_cash += calculatedTotal;
      } else if (payment_method !== 'charged_to_field') {
        activeShift.total_electronic_sales += calculatedTotal;
      }
    }

    res.status(201).json({
      success: true,
      message: payment_method === 'charged_to_field'
        ? `Consumo de $${calculatedTotal.toLocaleString('es-CO')} cargado exitosamente a la reserva de la cancha.`
        : 'Venta registrada con éxito.',
      order,
      charged_to_court: !!targetReservation
    });
  } catch (err) {
    next(err);
  }
};

// Consultar o cerrar turno de caja (Arqueo y Descuadre)
const closeShift = async (req, res, next) => {
  try {
    const { actual_cash, notes } = req.body;
    const venueId = req.body.venue_id || (req.user ? req.user.venue_id : 'a0000000-0000-0000-0000-000000000001');

    const activeShift = await db.findActiveShift(venueId);
    if (!activeShift) {
      return res.status(404).json({ success: false, error: 'No hay un turno de caja abierto en esta sede.' });
    }

    const countedCash = Number(actual_cash || 0);
    const difference = countedCash - activeShift.expected_cash;

    const closed = await db.closeShift(activeShift.id, {
      actual_cash: countedCash,
      difference: difference,
      notes: notes || '',
      closed_by: req.user ? req.user.name : 'Cajero'
    });

    res.json({
      success: true,
      message: difference === 0
        ? '¡Cierre de caja perfecto! Sin descuadres.'
        : (difference < 0 ? `Atención: Faltante en caja de -$${Math.abs(difference).toLocaleString('es-CO')}` : `Sobrante en caja de +$${difference.toLocaleString('es-CO')}`),
      shift_summary: closed
    });
  } catch (err) {
    next(err);
  }
};

// Ver estado del turno actual
const getActiveShift = async (req, res, next) => {
  try {
    const venueId = req.query.venue_id || (req.user ? req.user.venue_id : 'a0000000-0000-0000-0000-000000000001');
    const shift = await db.findActiveShift(venueId);
    res.json({ success: true, shift: shift || null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProducts,
  createProduct,
  createOrder,
  closeShift,
  getActiveShift
};
