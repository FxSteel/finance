-- ===========================================
-- SEED: Datos fake para pruebas
-- Ejecutar en Supabase > SQL Editor
-- ===========================================
-- IMPORTANTE: Reemplaza este UUID con tu user_id
-- (Supabase > Authentication > Users > copia tu UUID)
-- ===========================================

DO $$
DECLARE
  v_owner_id UUID := '00000000-0000-0000-0000-000000000000'; -- <-- REEMPLAZA CON TU USER ID

  -- Category IDs
  cat_supermercado UUID;
  cat_transporte UUID;
  cat_entretenimiento UUID;
  cat_salud UUID;
  cat_servicios UUID;
  cat_restaurantes UUID;
  cat_educacion UUID;
  cat_sueldo UUID;

  -- Credit card IDs
  card_visa UUID;
  card_mastercard UUID;
  card_debito UUID;

  -- Helpers
  v_tx_id UUID;
  v_date DATE;
  v_amount NUMERIC;
  v_installments INT;
  v_card_id UUID;
  v_cat_id UUID;
  v_desc TEXT;
  v_type TEXT;
  v_method TEXT;
  v_priority TEXT;
  i INT;
  j INT;
  v_due DATE;
BEGIN
  -- =====================
  -- CATEGORIAS
  -- =====================
  INSERT INTO categories (name, color, icon, user_id) VALUES ('Supermercado', '#2D8659', NULL, v_owner_id) RETURNING id INTO cat_supermercado;
  INSERT INTO categories (name, color, icon, user_id) VALUES ('Transporte', '#5B5DEF', NULL, v_owner_id) RETURNING id INTO cat_transporte;
  INSERT INTO categories (name, color, icon, user_id) VALUES ('Entretenimiento', '#C4A876', NULL, v_owner_id) RETURNING id INTO cat_entretenimiento;
  INSERT INTO categories (name, color, icon, user_id) VALUES ('Salud', '#B83A3A', NULL, v_owner_id) RETURNING id INTO cat_salud;
  INSERT INTO categories (name, color, icon, user_id) VALUES ('Servicios', '#888780', NULL, v_owner_id) RETURNING id INTO cat_servicios;
  INSERT INTO categories (name, color, icon, user_id) VALUES ('Restaurantes', '#E67E22', NULL, v_owner_id) RETURNING id INTO cat_restaurantes;
  INSERT INTO categories (name, color, icon, user_id) VALUES ('Educacion', '#3498DB', NULL, v_owner_id) RETURNING id INTO cat_educacion;
  INSERT INTO categories (name, color, icon, user_id) VALUES ('Sueldo', '#27AE60', NULL, v_owner_id) RETURNING id INTO cat_sueldo;

  RAISE NOTICE '8 categorias creadas';

  -- =====================
  -- TARJETAS
  -- =====================
  INSERT INTO credit_cards (name, last_four_digits, type, payment_day, closing_day, credit_limit, credit_limit_usd, currency, color, owner_id)
  VALUES ('Visa Banco Estado', '4521', 'credit', 15, 5, 2000000, NULL, 'CLP', 'from-[#5B5DEF] to-[#3538A8]', v_owner_id)
  RETURNING id INTO card_visa;

  INSERT INTO credit_cards (name, last_four_digits, type, payment_day, closing_day, credit_limit, credit_limit_usd, currency, color, owner_id)
  VALUES ('Mastercard Falabella', '8734', 'credit', 20, 10, 1500000, 1500, 'both', 'from-[#B83A3A] to-[#7A2525]', v_owner_id)
  RETURNING id INTO card_mastercard;

  INSERT INTO credit_cards (name, last_four_digits, type, payment_day, closing_day, credit_limit, credit_limit_usd, currency, color, owner_id)
  VALUES ('Debito Cuenta RUT', '1199', 'debit', 1, 1, NULL, NULL, 'CLP', 'from-[#1F1F23] to-[#0A0A0B]', v_owner_id)
  RETURNING id INTO card_debito;

  RAISE NOTICE '3 tarjetas creadas';

  -- =====================
  -- TRANSACCIONES (60)
  -- =====================
  FOR i IN 1..60 LOOP
    -- Fecha aleatoria en los ultimos 90 dias
    v_date := CURRENT_DATE - (floor(random() * 90))::INT;

    -- 20% ingresos, 80% egresos
    IF random() < 0.2 THEN
      v_type := 'income';
      v_method := 'debit';
      v_card_id := NULL;
      v_installments := 1;

      -- Elegir ingreso aleatorio
      CASE floor(random() * 4)::INT
        WHEN 0 THEN v_desc := 'Sueldo'; v_amount := 1200000 + floor(random() * 600000); v_cat_id := cat_sueldo;
        WHEN 1 THEN v_desc := 'Freelance diseno'; v_amount := 200000 + floor(random() * 300000); v_cat_id := cat_sueldo;
        WHEN 2 THEN v_desc := 'Venta marketplace'; v_amount := 15000 + floor(random() * 65000); v_cat_id := cat_entretenimiento;
        ELSE v_desc := 'Devolucion impuestos'; v_amount := 100000 + floor(random() * 200000); v_cat_id := cat_servicios;
      END CASE;
    ELSE
      v_type := 'expense';

      -- 40% credito, 60% debito
      IF random() < 0.4 THEN
        v_method := 'credit';
        IF random() < 0.5 THEN v_card_id := card_visa; ELSE v_card_id := card_mastercard; END IF;
        -- 30% en cuotas
        IF random() < 0.3 THEN
          CASE floor(random() * 3)::INT WHEN 0 THEN v_installments := 3; WHEN 1 THEN v_installments := 6; ELSE v_installments := 12; END CASE;
        ELSE
          v_installments := 1;
        END IF;
      ELSE
        v_method := 'debit';
        v_card_id := NULL;
        v_installments := 1;
      END IF;

      -- Elegir gasto aleatorio
      CASE floor(random() * 18)::INT
        WHEN 0  THEN v_desc := 'Supermercado Lider'; v_amount := 15000 + floor(random() * 105000); v_cat_id := cat_supermercado;
        WHEN 1  THEN v_desc := 'Uber'; v_amount := 2000 + floor(random() * 10000); v_cat_id := cat_transporte;
        WHEN 2  THEN v_desc := 'Netflix'; v_amount := 6500; v_cat_id := cat_entretenimiento;
        WHEN 3  THEN v_desc := 'Spotify'; v_amount := 4500; v_cat_id := cat_entretenimiento;
        WHEN 4  THEN v_desc := 'Farmacia Ahumada'; v_amount := 5000 + floor(random() * 30000); v_cat_id := cat_salud;
        WHEN 5  THEN v_desc := 'Cuenta de luz'; v_amount := 15000 + floor(random() * 30000); v_cat_id := cat_servicios;
        WHEN 6  THEN v_desc := 'Cuenta de agua'; v_amount := 8000 + floor(random() * 12000); v_cat_id := cat_servicios;
        WHEN 7  THEN v_desc := 'Internet VTR'; v_amount := 25000; v_cat_id := cat_servicios;
        WHEN 8  THEN v_desc := 'Starbucks'; v_amount := 3500 + floor(random() * 4500); v_cat_id := cat_restaurantes;
        WHEN 9  THEN v_desc := 'Sushi delivery'; v_amount := 12000 + floor(random() * 16000); v_cat_id := cat_restaurantes;
        WHEN 10 THEN v_desc := 'McDonalds'; v_amount := 4000 + floor(random() * 8000); v_cat_id := cat_restaurantes;
        WHEN 11 THEN v_desc := 'Bencinera Copec'; v_amount := 20000 + floor(random() * 30000); v_cat_id := cat_transporte;
        WHEN 12 THEN v_desc := 'Metro de Santiago'; v_amount := 700; v_cat_id := cat_transporte;
        WHEN 13 THEN v_desc := 'Curso Udemy'; v_amount := 8000 + floor(random() * 7000); v_cat_id := cat_educacion;
        WHEN 14 THEN v_desc := 'Dentista'; v_amount := 30000 + floor(random() * 50000); v_cat_id := cat_salud;
        WHEN 15 THEN v_desc := 'Ropa Zara'; v_amount := 20000 + floor(random() * 40000); v_cat_id := cat_entretenimiento;
        WHEN 16 THEN v_desc := 'Arriendo'; v_amount := 450000; v_cat_id := cat_servicios;
        ELSE v_desc := 'Mercado Libre'; v_amount := 10000 + floor(random() * 70000); v_cat_id := cat_entretenimiento;
      END CASE;
    END IF;

    -- Prioridad aleatoria
    CASE floor(random() * 3)::INT WHEN 0 THEN v_priority := 'high'; WHEN 1 THEN v_priority := 'medium'; ELSE v_priority := 'low'; END CASE;

    -- Insertar transaccion
    INSERT INTO transactions (type, amount, currency, description, category_id, payment_method, credit_card_id, installments, owner_id, priority, date)
    VALUES (v_type, v_amount, 'CLP', v_desc, v_cat_id, v_method, v_card_id, v_installments, v_owner_id, v_priority, v_date)
    RETURNING id INTO v_tx_id;

    -- Crear cuotas si aplica
    IF v_installments > 1 THEN
      FOR j IN 1..v_installments LOOP
        v_due := v_date + (j * INTERVAL '1 month');
        -- Ajustar al dia de pago de la tarjeta
        IF v_card_id = card_visa THEN
          v_due := date_trunc('month', v_due) + INTERVAL '14 days'; -- dia 15
        ELSE
          v_due := date_trunc('month', v_due) + INTERVAL '19 days'; -- dia 20
        END IF;

        INSERT INTO installment_payments (transaction_id, installment_number, amount, due_date, is_paid)
        VALUES (v_tx_id, j, round(v_amount::NUMERIC / v_installments, 2), v_due, v_due < CURRENT_DATE);
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE '60 transacciones creadas con sus cuotas';
  RAISE NOTICE 'Seed completado!';
END $$;
