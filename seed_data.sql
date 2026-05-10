-- ============================================================
-- SEED DATA: ТехноСвіт — CRM для продажу техніки
-- ============================================================
-- project_id = 1, user_id = 3 (Карпляк Василь)

-- Очистка перед заповненням
DELETE FROM deal_events;
DELETE FROM task;
DELETE FROM deal;
DELETE FROM client_notes;
DELETE FROM client WHERE project_id = 1;

-- ========== 1. КЛІЄНТИ (12 шт) ==========
-- Статуси: NEW, IN_WORK, CLIENT, ARCHIVED
INSERT INTO client (name, company, email, phone, status, project_id, client_user_id) VALUES
('Олександр Петренко', 'Comfy',          'o.petrenko@comfy.ua',       '+380671234567', 'CLIENT',      1, 3),
('Ірина Коваленко',   'Rozetka',         'i.kovalenko@rozetka.com.ua','+380501112233', 'IN_WORK',     1, 3),
('Михайло Бондаренко','Фокстрот',        'm.bondarenko@foxtrot.com.ua','+380931234455','IN_WORK',     1, 3),
('Анна Шевченко',     'АЛЛО',            'a.shevchenko@allo.ua',      '+380661234567', 'NEW',         1, 3),
('Дмитро Лисенко',    'Citrus',          'd.lysenko@citrus.ua',       '+380731234567', 'CLIENT',      1, 3),
('Катерина Мельник',  'Eldorado',        'k.melnyk@eldorado.ua',      '+380961234567', 'IN_WORK',     1, 3),
('Андрій Ткаченко',   'Moyo',            'a.tkachenko@moyo.ua',       '+380991234567', 'NEW',         1, 3),
('Олена Кравченко',   'Технополіс',      'o.kravchenko@technopolis.ua','+380681234567','NEW',         1, 3),
('Віталій Захарченко','Brain Computers',  'v.zakharchenko@brain.ua',   '+380631234567', 'ARCHIVED',    1, 3),
('Наталія Савченко',  'Telemart',        'n.savchenko@telemart.ua',   '+380501234567', 'IN_WORK',     1, 3),
('Сергій Полішук',    'АСБІС Україна',   's.polishuk@asbis.ua',       '+380671239999', 'CLIENT',      1, 3),
('Марія Гончар',      'Stylus',          'm.gonchar@stylus.ua',       '+380931239999', 'NEW',         1, 3);

-- ========== 2. УГОДИ (8 шт, різні статуси) ==========

-- Угода 1: DONE (виграна)
INSERT INTO deal (title, budget, currency, status, client_id, user_id, project_id, created_at, updated_at)
VALUES ('Поставка 500 ноутбуків HP для Comfy', 3750000.00, 'UAH', 'DONE',
  (SELECT id FROM client WHERE email='o.petrenko@comfy.ua' LIMIT 1), 3, 1,
  NOW() - INTERVAL '45 days', NOW() - INTERVAL '5 days');

-- Угода 2: DELIVERY (в процесі доставки)
INSERT INTO deal (title, budget, currency, status, client_id, user_id, project_id, created_at, updated_at)
VALUES ('Розширення асортименту Samsung для Rozetka', 8500000.00, 'UAH', 'DELIVERY',
  (SELECT id FROM client WHERE email='i.kovalenko@rozetka.com.ua' LIMIT 1), 3, 1,
  NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 days');

-- Угода 3: QUALIFICATION (кваліфікація)
INSERT INTO deal (title, budget, currency, status, client_id, user_id, project_id, created_at, updated_at)
VALUES ('Партія моніторів LG для Фокстрот', 1200000.00, 'UAH', 'QUALIFICATION',
  (SELECT id FROM client WHERE email='m.bondarenko@foxtrot.com.ua' LIMIT 1), 3, 1,
  NOW() - INTERVAL '14 days', NOW() - INTERVAL '1 day');

-- Угода 4: NEW (нова)
INSERT INTO deal (title, budget, currency, status, client_id, user_id, project_id, created_at, updated_at)
VALUES ('Планшети Lenovo для мережі АЛЛО', 640000.00, 'UAH', 'NEW',
  (SELECT id FROM client WHERE email='a.shevchenko@allo.ua' LIMIT 1), 3, 1,
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- Угода 5: DONE (виграна)
INSERT INTO deal (title, budget, currency, status, client_id, user_id, project_id, created_at, updated_at)
VALUES ('Аксесуари Apple для Citrus — Q1 2026', 45000.00, 'USD', 'DONE',
  (SELECT id FROM client WHERE email='d.lysenko@citrus.ua' LIMIT 1), 3, 1,
  NOW() - INTERVAL '60 days', NOW() - INTERVAL '15 days');

-- Угода 6: QUALIFICATION (кваліфікація)
INSERT INTO deal (title, budget, currency, status, client_id, user_id, project_id, created_at, updated_at)
VALUES ('Смартфони Xiaomi для Eldorado — літній сезон', 2300000.00, 'UAH', 'QUALIFICATION',
  (SELECT id FROM client WHERE email='k.melnyk@eldorado.ua' LIMIT 1), 3, 1,
  NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day');

-- Угода 7: LOST (програна)
INSERT INTO deal (title, budget, currency, status, client_id, user_id, project_id, created_at, updated_at)
VALUES ('Комплектуючі для Brain Computers — серверне обладнання', 920000.00, 'UAH', 'LOST',
  (SELECT id FROM client WHERE email='v.zakharchenko@brain.ua' LIMIT 1), 3, 1,
  NOW() - INTERVAL '50 days', NOW() - INTERVAL '20 days');

-- Угода 8: DELIVERY (доставка)
INSERT INTO deal (title, budget, currency, status, client_id, user_id, project_id, created_at, updated_at)
VALUES ('Корпоративна поставка Dell для АСБІС', 15000.00, 'EUR', 'DELIVERY',
  (SELECT id FROM client WHERE email='s.polishuk@asbis.ua' LIMIT 1), 3, 1,
  NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days');


-- ========== 3. ІСТОРІЯ УГОД (DealEvents) ==========

-- Угода 1 (Comfy — DONE) — повна історія
INSERT INTO deal_events (deal_id, event_type, description, created_at) VALUES
((SELECT id FROM deal WHERE title LIKE '%Comfy%' LIMIT 1), 'CREATED',        'Угоду створено. Клієнт зацікавлений у великій партії ноутбуків HP EliteBook.',  NOW() - INTERVAL '45 days'),
((SELECT id FROM deal WHERE title LIKE '%Comfy%' LIMIT 1), 'NOTE',           'Зустріч з Олександром. Обговорили об''єми та графік поставок на 3 місяці.',     NOW() - INTERVAL '40 days'),
((SELECT id FROM deal WHERE title LIKE '%Comfy%' LIMIT 1), 'STATUS_CHANGED', 'Статус змінено з NEW на QUALIFICATION',                                         NOW() - INTERVAL '38 days'),
((SELECT id FROM deal WHERE title LIKE '%Comfy%' LIMIT 1), 'NOTE',           'Надіслано комерційну пропозицію. Клієнт просить знижку 7% за обсяг.',           NOW() - INTERVAL '30 days'),
((SELECT id FROM deal WHERE title LIKE '%Comfy%' LIMIT 1), 'STATUS_CHANGED', 'Статус змінено з QUALIFICATION на DELIVERY',                                    NOW() - INTERVAL '20 days'),
((SELECT id FROM deal WHERE title LIKE '%Comfy%' LIMIT 1), 'NOTE',           'Перша партія 200 шт відвантажена. Клієнт підтвердив отримання.',                NOW() - INTERVAL '15 days'),
((SELECT id FROM deal WHERE title LIKE '%Comfy%' LIMIT 1), 'NOTE',           'Друга партія 300 шт доставлена. Акт виконаних робіт підписано.',                NOW() - INTERVAL '8 days'),
((SELECT id FROM deal WHERE title LIKE '%Comfy%' LIMIT 1), 'STATUS_CHANGED', 'Статус змінено з DELIVERY на DONE',                                            NOW() - INTERVAL '5 days'),
((SELECT id FROM deal WHERE title LIKE '%Comfy%' LIMIT 1), 'NOTE',           'Оплата отримана в повному обсязі. Клієнт задоволений, планує повторне замовлення.',NOW() - INTERVAL '5 days');

-- Угода 2 (Rozetka — DELIVERY)
INSERT INTO deal_events (deal_id, event_type, description, created_at) VALUES
((SELECT id FROM deal WHERE title LIKE '%Rozetka%' LIMIT 1), 'CREATED',        'Угоду створено. Rozetka хоче розширити лінійку Samsung.',                      NOW() - INTERVAL '30 days'),
((SELECT id FROM deal WHERE title LIKE '%Rozetka%' LIMIT 1), 'NOTE',           'Дзвінок з Іриною. Вимоги: Galaxy S-серія, A-серія, Tab серія. Великий обсяг.', NOW() - INTERVAL '25 days'),
((SELECT id FROM deal WHERE title LIKE '%Rozetka%' LIMIT 1), 'STATUS_CHANGED', 'Статус змінено з NEW на QUALIFICATION',                                        NOW() - INTERVAL '22 days'),
((SELECT id FROM deal WHERE title LIKE '%Rozetka%' LIMIT 1), 'NOTE',           'Підготовлено детальну специфікацію. 1200+ одиниць різних моделей.',             NOW() - INTERVAL '18 days'),
((SELECT id FROM deal WHERE title LIKE '%Rozetka%' LIMIT 1), 'STATUS_CHANGED', 'Статус змінено з QUALIFICATION на DELIVERY',                                   NOW() - INTERVAL '10 days'),
((SELECT id FROM deal WHERE title LIKE '%Rozetka%' LIMIT 1), 'NOTE',           'Контракт підписано. Перша партія Galaxy A15 і A25 відправлена зі складу.',     NOW() - INTERVAL '7 days');

-- Угода 3 (Фокстрот — QUALIFICATION)
INSERT INTO deal_events (deal_id, event_type, description, created_at) VALUES
((SELECT id FROM deal WHERE title LIKE '%Фокстрот%' LIMIT 1), 'CREATED',        'Угоду створено. Запит на монітори LG UltraWide для офісного сегменту.',      NOW() - INTERVAL '14 days'),
((SELECT id FROM deal WHERE title LIKE '%Фокстрот%' LIMIT 1), 'NOTE',           'Михайло надіслав ТЗ. Потрібно 27" та 34" монітори, ~300 одиниць.',           NOW() - INTERVAL '10 days'),
((SELECT id FROM deal WHERE title LIKE '%Фокстрот%' LIMIT 1), 'STATUS_CHANGED', 'Статус змінено з NEW на QUALIFICATION',                                      NOW() - INTERVAL '7 days'),
((SELECT id FROM deal WHERE title LIKE '%Фокстрот%' LIMIT 1), 'NOTE',           'Чекаємо на фінальне погодження бюджету від керівництва Фокстрот.',           NOW() - INTERVAL '1 day');

-- Угода 5 (Citrus — DONE)
INSERT INTO deal_events (deal_id, event_type, description, created_at) VALUES
((SELECT id FROM deal WHERE title LIKE '%Citrus%' LIMIT 1), 'CREATED',        'Угоду створено. Citrus замовив аксесуари Apple: чохли, зарядки, AirTag.',   NOW() - INTERVAL '60 days'),
((SELECT id FROM deal WHERE title LIKE '%Citrus%' LIMIT 1), 'STATUS_CHANGED', 'Статус змінено з NEW на QUALIFICATION',                                      NOW() - INTERVAL '50 days'),
((SELECT id FROM deal WHERE title LIKE '%Citrus%' LIMIT 1), 'NOTE',           'Погоджено ціни. Знижка 5% за передоплату.',                                  NOW() - INTERVAL '40 days'),
((SELECT id FROM deal WHERE title LIKE '%Citrus%' LIMIT 1), 'STATUS_CHANGED', 'Статус змінено з QUALIFICATION на DELIVERY',                                 NOW() - INTERVAL '30 days'),
((SELECT id FROM deal WHERE title LIKE '%Citrus%' LIMIT 1), 'STATUS_CHANGED', 'Статус змінено з DELIVERY на DONE',                                          NOW() - INTERVAL '15 days'),
((SELECT id FROM deal WHERE title LIKE '%Citrus%' LIMIT 1), 'NOTE',           'Все доставлено та оплачено. Клієнт планує наступне замовлення у Q3.',         NOW() - INTERVAL '15 days');

-- Угода 7 (Brain — LOST)
INSERT INTO deal_events (deal_id, event_type, description, created_at) VALUES
((SELECT id FROM deal WHERE title LIKE '%Brain%' LIMIT 1), 'CREATED',        'Угоду створено. Brain Computers потребує серверне обладнання HPE.',          NOW() - INTERVAL '50 days'),
((SELECT id FROM deal WHERE title LIKE '%Brain%' LIMIT 1), 'STATUS_CHANGED', 'Статус змінено з NEW на QUALIFICATION',                                     NOW() - INTERVAL '40 days'),
((SELECT id FROM deal WHERE title LIKE '%Brain%' LIMIT 1), 'NOTE',           'Клієнт порівнює нашу пропозицію з конкурентами. Ціна критична.',             NOW() - INTERVAL '30 days'),
((SELECT id FROM deal WHERE title LIKE '%Brain%' LIMIT 1), 'STATUS_CHANGED', 'Статус змінено з QUALIFICATION на LOST',                                    NOW() - INTERVAL '20 days'),
((SELECT id FROM deal WHERE title LIKE '%Brain%' LIMIT 1), 'NOTE',           'Клієнт обрав іншого постачальника через нижчу ціну. Підтримуємо контакт.',  NOW() - INTERVAL '20 days');

-- Угода 6 (Eldorado — QUALIFICATION)
INSERT INTO deal_events (deal_id, event_type, description, created_at) VALUES
((SELECT id FROM deal WHERE title LIKE '%Eldorado%' LIMIT 1), 'CREATED',        'Угоду створено. Eldorado готується до літнього сезону — потрібні Xiaomi.',NOW() - INTERVAL '10 days'),
((SELECT id FROM deal WHERE title LIKE '%Eldorado%' LIMIT 1), 'NOTE',           'Катерина надіслала список моделей: Redmi Note 13, Poco X6, Xiaomi 14.', NOW() - INTERVAL '7 days'),
((SELECT id FROM deal WHERE title LIKE '%Eldorado%' LIMIT 1), 'STATUS_CHANGED', 'Статус змінено з NEW на QUALIFICATION',                                  NOW() - INTERVAL '5 days');


-- ========== 4. ЗАВДАННЯ (10 шт, різні статуси) ==========

INSERT INTO task (title, description, tag, deadline, user_id, project_id, task_user_id, deal_id, client_id) VALUES
-- PLANNED (4 завдання)
('Підготувати КП для АЛЛО',
 'Скласти комерційну пропозицію на планшети Lenovo Tab M10 та M11. Включити знижку за обсяг від 200 шт.',
 'PLANNED', NOW() + INTERVAL '5 days', 3, 1, 3,
 (SELECT id FROM deal WHERE title LIKE '%АЛЛО%' LIMIT 1),
 (SELECT id FROM client WHERE email='a.shevchenko@allo.ua' LIMIT 1)),

('Аналіз конкурентів по Samsung',
 'Порівняти наші ціни на Galaxy A-серію з пропозиціями інших дистриб''юторів для Rozetka.',
 'PLANNED', NOW() + INTERVAL '3 days', 3, 1, 3,
 (SELECT id FROM deal WHERE title LIKE '%Rozetka%' LIMIT 1),
 (SELECT id FROM client WHERE email='i.kovalenko@rozetka.com.ua' LIMIT 1)),

('Зателефонувати Марії Гончар зі Stylus',
 'Першийнний дзвінок. Дізнатися потреби клієнта, запропонувати каталог продукції ТехноСвіт.',
 'PLANNED', NOW() + INTERVAL '2 days', 3, 1, 3, NULL,
 (SELECT id FROM client WHERE email='m.gonchar@stylus.ua' LIMIT 1)),

('Оновити прайс-лист Q2 2026',
 'Оновити прайс-лист на всі категорії техніки з урахуванням нових курсів та знижок від виробників.',
 'PLANNED', NOW() + INTERVAL '7 days', 3, 1, 3, NULL, NULL),

-- IN_WORK (3 завдання)
('Узгодити логістику для Rozetka',
 'Скоординувати з транспортною компанією Нова Пошта доставку другої партії Samsung на склад Rozetka у Києві.',
 'IN_WORK', NOW() + INTERVAL '4 days', 3, 1, 3,
 (SELECT id FROM deal WHERE title LIKE '%Rozetka%' LIMIT 1),
 (SELECT id FROM client WHERE email='i.kovalenko@rozetka.com.ua' LIMIT 1)),

('Підготувати презентацію для Eldorado',
 'Створити презентацію переваг Xiaomi 14 серії для зустрічі з керівництвом закупівель Eldorado.',
 'IN_WORK', NOW() + INTERVAL '2 days', 3, 1, 3,
 (SELECT id FROM deal WHERE title LIKE '%Eldorado%' LIMIT 1),
 (SELECT id FROM client WHERE email='k.melnyk@eldorado.ua' LIMIT 1)),

('Перевірити залишки на складі для АСБІС',
 'Інвентаризація Dell Latitude та OptiPlex на складі. Підтвердити наявність для відвантаження.',
 'IN_WORK', NOW() + INTERVAL '1 day', 3, 1, 3,
 (SELECT id FROM deal WHERE title LIKE '%АСБІС%' LIMIT 1),
 (SELECT id FROM client WHERE email='s.polishuk@asbis.ua' LIMIT 1)),

-- DONE (3 завдання)
('Підписати акт з Comfy',
 'Фінальний акт виконаних робіт по поставці 500 ноутбуків HP. Документи підписано обома сторонами.',
 'DONE', NOW() - INTERVAL '6 days', 3, 1, 3,
 (SELECT id FROM deal WHERE title LIKE '%Comfy%' LIMIT 1),
 (SELECT id FROM client WHERE email='o.petrenko@comfy.ua' LIMIT 1)),

('Відправити рахунок Citrus',
 'Виставити фінальний рахунок за аксесуари Apple. Сума: $45,000. Оплата отримана.',
 'DONE', NOW() - INTERVAL '16 days', 3, 1, 3,
 (SELECT id FROM deal WHERE title LIKE '%Citrus%' LIMIT 1),
 (SELECT id FROM client WHERE email='d.lysenko@citrus.ua' LIMIT 1)),

('Зустріч з Фокстрот у Києві',
 'Провели зустріч з Михайлом у офісі Фокстрот. Обговорили специфікацію моніторів LG. Рішення до кінця тижня.',
 'DONE', NOW() - INTERVAL '3 days', 3, 1, 3,
 (SELECT id FROM deal WHERE title LIKE '%Фокстрот%' LIMIT 1),
 (SELECT id FROM client WHERE email='m.bondarenko@foxtrot.com.ua' LIMIT 1));

-- ========== 5. ЗАМІТКИ КЛІЄНТІВ ==========
INSERT INTO client_notes (client_id, note) VALUES
((SELECT id FROM client WHERE email='o.petrenko@comfy.ua' LIMIT 1),       'VIP-клієнт. Постійний партнер з 2024 року.'),
((SELECT id FROM client WHERE email='o.petrenko@comfy.ua' LIMIT 1),       'Кращий час для дзвінка: 10:00-12:00.'),
((SELECT id FROM client WHERE email='i.kovalenko@rozetka.com.ua' LIMIT 1),'Головний контакт по закупівлях Samsung.'),
((SELECT id FROM client WHERE email='d.lysenko@citrus.ua' LIMIT 1),       'Планує велике замовлення на Q3 2026.'),
((SELECT id FROM client WHERE email='v.zakharchenko@brain.ua' LIMIT 1),   'Пішов до конкурента. Підтримувати відносини — може повернутися.'),
((SELECT id FROM client WHERE email='s.polishuk@asbis.ua' LIMIT 1),       'Корпоративний клієнт. Працює тільки з EUR рахунками.');
