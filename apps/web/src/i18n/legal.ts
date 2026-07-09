// Huquqiy sahifalar kontenti (T4, brief v3): Maxfiylik siyosati + Foydalanuvchi
// kelishuvi — to'liq uz va ru matnlar. i18n resurslariga legal: kaliti sifatida ulanadi.

export interface LegalSection {
  h: string;
  p: string[];
}
export interface LegalDoc {
  title: string;
  updated: string;
  metaDesc: string;
  sections: LegalSection[];
}

export const legalUz: { privacy: LegalDoc; terms: LegalDoc } = {
  privacy: {
    title: 'Maxfiylik siyosati',
    updated: 'Oxirgi yangilanish: 2026-yil 9-iyul',
    metaDesc:
      "Smeta AI (smeta-ai.uz) maxfiylik siyosati: qanday ma'lumotlar yig'iladi, qanday maqsadda ishlatiladi va qanday himoyalanadi.",
    sections: [
      {
        h: '1. Umumiy qoidalar',
        p: [
          "Ushbu Maxfiylik siyosati Smeta AI platformasi (smeta-ai.uz sayti va unga tegishli xizmatlar, keyingi o'rinlarda — \"Platforma\") foydalanuvchilarining shaxsga doir ma'lumotlarini yig'ish, qayta ishlash va himoya qilish tartibini belgilaydi. Ma'lumotlar operatori — Smeta AI xizmati ma'muriyati (aloqa: info.smeta.ai@gmail.com).",
          "Platformadan foydalanish orqali siz ushbu siyosat shartlariga rozilik bildirasiz. Ma'lumotlaringiz O'zbekiston Respublikasining \"Shaxsga doir ma'lumotlar to'g'risida\"gi Qonuni (O'RQ-547, 02.07.2019) talablariga muvofiq qayta ishlanadi.",
        ],
      },
      {
        h: "2. Qanday ma'lumotlar yig'iladi",
        p: [
          "Hisob ma'lumotlari: ism-familiya, elektron pochta, telefon raqami, kompaniya nomi va hisob paroli (qaytarilmas hash ko'rinishida saqlanadi).",
          "Siz kiritadigan ish ma'lumotlari: smetalar, loyihalar, xarajat va daromad yozuvlari, materiallar buyurtmalari va shu kabi Platformada yaratadigan kontentingiz.",
          "Texnik ma'lumotlar: IP-manzil, brauzer turi, qurilma haqidagi umumiy ma'lumot, sayt bilan ishlash statistikasi va cookie fayllar.",
        ],
      },
      {
        h: '3. Foydalanish maqsadlari',
        p: [
          "Ma'lumotlar quyidagi maqsadlarda ishlatiladi: xizmatni ko'rsatish va hisobingizni yuritish; smeta va hisobotlarni saqlash hamda qurilmalararo sinxronlash; texnik yordam ko'rsatish; xizmat sifatini yaxshilash va statistik tahlil; qonun talablarini bajarish.",
          "Ma'lumotlaringiz reklama maqsadida uchinchi shaxslarga sotilmaydi.",
        ],
      },
      {
        h: '4. Cookie va analitika',
        p: [
          "Platforma sessiyani yuritish (avtorizatsiya), til va valyuta sozlamalarini eslab qolish uchun cookie hamda localStorage'dan foydalanadi.",
          "Sayt trafigini tahlil qilish uchun Google Analytics (o'lchov identifikatori G-1WZPY46RW1) ishlatiladi. U anonimlashtirilgan statistik ma'lumotlarni to'playdi. Brauzer sozlamalari orqali cookie'larni o'chirishingiz mumkin — bu asosiy funksiyalarga ta'sir qilishi mumkin.",
        ],
      },
      {
        h: "5. Ma'lumotlarni saqlash va himoya",
        p: [
          "Ma'lumotlar himoyalangan serverlarda saqlanadi. Barcha aloqa HTTPS (TLS) orqali shifrlanadi, parollar qaytarilmas hash ko'rinishida saqlanadi, har bir kompaniya (tenant) ma'lumotlari boshqalardan dasturiy jihatdan to'liq ajratilgan.",
          "Ma'lumotlarga kirish faqat vakolatli xodimlarga, xizmat ko'rsatish uchun zarur bo'lgan hajmda beriladi. Muntazam zaxira nusxalari olinadi.",
        ],
      },
      {
        h: '6. Uchinchi shaxslarga berish',
        p: [
          "Ma'lumotlar faqat quyidagi hollarda uchinchi shaxslarga berilishi mumkin: qonunda belgilangan hollarda vakolatli davlat organlarining talabi bo'yicha; to'lov xizmatlari ulangach (Payme, Click) — to'lovni amalga oshirish uchun zarur minimal hajmda; hosting va infratuzilma provayderlariga — xizmatni texnik ta'minlash doirasida.",
        ],
      },
      {
        h: '7. Sizning huquqlaringiz',
        p: [
          "Siz o'z ma'lumotlaringizga kirish, ularni to'g'rilash, yangilash yoki o'chirishni talab qilish huquqiga egasiz. Buning uchun info.smeta.ai@gmail.com manziliga murojaat qiling yoki profil sozlamalaridan foydalaning.",
          "Hisob o'chirilganda shaxsga doir ma'lumotlaringiz qonunda belgilangan saqlash muddatlari tugagach o'chiriladi.",
        ],
      },
      {
        h: "8. Saqlash muddati va siyosat o'zgarishi",
        p: [
          "Ma'lumotlar hisobingiz faol bo'lgan davr mobaynida va xizmat ko'rsatish uchun zarur muddatda saqlanadi.",
          "Ushbu siyosatga o'zgartirishlar kiritilishi mumkin. Muhim o'zgarishlar haqida Platformada e'lon qilinadi; sahifaning yuqorisidagi \"Oxirgi yangilanish\" sanasi yangilanadi. Savollar uchun: info.smeta.ai@gmail.com.",
        ],
      },
    ],
  },
  terms: {
    title: 'Foydalanuvchi kelishuvi',
    updated: 'Oxirgi yangilanish: 2026-yil 9-iyul',
    metaDesc:
      "Smeta AI (smeta-ai.uz) foydalanuvchi kelishuvi: xizmat shartlari, obuna, javobgarlik chegaralari va tomonlarning huquqlari.",
    sections: [
      {
        h: '1. Kelishuv predmeti',
        p: [
          "Smeta AI — sun'iy intellekt yordamida qurilish smetalarini hisoblash, loyihalar va xarajatlarni boshqarish uchun onlayn platforma (smeta-ai.uz).",
          "Ushbu kelishuv Platformadan foydalanish shartlarini belgilaydi. Ro'yxatdan o'tish orqali siz kelishuv shartlarini to'liq qabul qilasiz.",
        ],
      },
      {
        h: "2. Ro'yxatdan o'tish va hisob",
        p: [
          "Ro'yxatdan o'tishda haqqoniy va dolzarb ma'lumotlarni kiritishingiz shart. Hisobingiz va parolingiz maxfiyligi uchun siz javobgarsiz — hisobingiz orqali bajarilgan barcha harakatlar sizniki hisoblanadi.",
          "Bitta hisob bitta kompaniyaga (tashkilotga) mo'ljallangan; kompaniya ichida foydalanuvchilar rollari (rahbar, menejer, muhandis) bilan ishlash mumkin.",
        ],
      },
      {
        h: '3. Foydalanish qoidalari',
        p: [
          "Platformadan qonuniy maqsadlarda foydalanish mumkin. Taqiqlanadi: tizim xavfsizligini buzishga urinish, boshqa foydalanuvchilar ma'lumotlariga ruxsatsiz kirish, xizmatga zarar yetkazuvchi avtomatlashtirilgan so'rovlar yuborish, Platformani qonunga zid kontent saqlash uchun ishlatish.",
        ],
      },
      {
        h: "4. Tariflar va to'lov",
        p: [
          "Xizmat pullik obuna asosida ko'rsatiladi. Amaldagi tariflar va narxlar bosh sahifadagi \"Narxlar\" bo'limida e'lon qilinadi va o'zgarishi mumkin; o'zgarishlar joriy to'langan davrga ta'sir qilmaydi.",
          "To'lov hozirda bank o'tkazmasi orqali qabul qilinadi; Payme va Click orqali onlayn to'lov ulangach, tegishli to'lov provayderlarining shartlari ham qo'llanadi.",
        ],
      },
      {
        h: '5. AI hisob-kitoblar bo\'yicha muhim ogohlantirish',
        p: [
          "AI tomonidan hisoblangan smeta taxminiy hisoblanadi. U siz kiritgan hajm va narxlarga asoslanadi va yordamchi vosita sifatida taqdim etiladi. Yakuniy qurilish smetasi, tender hujjatlari yoki shartnoma majburiyatlari uchun malakali mutaxassis (smetachi/muhandis) tekshiruvi tavsiya etiladi.",
          "Katalogdagi material narxlari axborot xarakteriga ega va real bozor narxlaridan farq qilishi mumkin.",
        ],
      },
      {
        h: '6. Javobgarlik chegarasi',
        p: [
          "Platforma \"boricha\" (as is) taqdim etiladi. Smeta AI hisob-kitoblardagi noaniqliklar, narxlarning o'zgarishi, foydalanuvchi kiritgan noto'g'ri ma'lumotlar yoki xizmatning vaqtincha uzilishi natijasida kelib chiqqan bilvosita zararlar (boy berilgan foyda, shartnoma yo'qotilishi va h.k.) uchun javobgar emas.",
          "Har qanday holatda Smeta AI'ning jami javobgarligi foydalanuvchi tomonidan so'nggi 12 oyda to'langan obuna summasi bilan cheklanadi.",
        ],
      },
      {
        h: '7. Intellektual mulk',
        p: [
          "Platforma, uning dizayni, dasturiy kodi va \"Smeta AI\" nomi/logotipi ma'muriyatga tegishli intellektual mulk hisoblanadi.",
          "Siz kiritgan ma'lumotlar (smetalar, loyihalar, hisobotlar) sizga tegishli bo'lib qoladi. Siz Platformaga ularni xizmat ko'rsatish maqsadida saqlash va qayta ishlashga ruxsat berasiz.",
        ],
      },
      {
        h: '8. Kelishuvni bekor qilish',
        p: [
          "Siz istalgan vaqtda hisobingizni o'chirishni so'rashingiz mumkin. Ma'muriyat qoidalar qo'pol buzilganda (3-bo'lim) hisobni ogohlantirish bilan cheklash yoki to'xtatish huquqiga ega.",
          "Obuna bekor qilinganda to'langan davr oxirigacha xizmatdan foydalanish saqlanib qoladi; ishlatilmagan davr uchun pul qaytarish alohida ko'rib chiqiladi.",
        ],
      },
      {
        h: "9. Qo'llaniladigan qonunchilik va aloqa",
        p: [
          "Ushbu kelishuvga O'zbekiston Respublikasi qonunchiligi qo'llaniladi. Nizolar avvalo muzokara yo'li bilan, kelishilmasa — O'zbekiston Respublikasi sudlarida hal qilinadi.",
          "Aloqa: info.smeta.ai@gmail.com · Toshkent, O'zbekiston.",
        ],
      },
    ],
  },
};

export const legalRu: { privacy: LegalDoc; terms: LegalDoc } = {
  privacy: {
    title: 'Политика конфиденциальности',
    updated: 'Последнее обновление: 9 июля 2026 г.',
    metaDesc:
      'Политика конфиденциальности Smeta AI (smeta-ai.uz): какие данные собираются, как используются и как защищаются.',
    sections: [
      {
        h: '1. Общие положения',
        p: [
          'Настоящая Политика конфиденциальности определяет порядок сбора, обработки и защиты персональных данных пользователей платформы Smeta AI (сайт smeta-ai.uz и связанные сервисы, далее — «Платформа»). Оператор данных — администрация сервиса Smeta AI (контакт: info.smeta.ai@gmail.com).',
          'Используя Платформу, вы соглашаетесь с условиями настоящей политики. Данные обрабатываются в соответствии с Законом Республики Узбекистан «О персональных данных» (ЗРУ-547 от 02.07.2019).',
        ],
      },
      {
        h: '2. Какие данные собираются',
        p: [
          'Данные аккаунта: имя и фамилия, электронная почта, номер телефона, название компании и пароль (хранится в виде необратимого хеша).',
          'Рабочие данные, которые вы вводите: сметы, проекты, записи о расходах и доходах, заказы материалов и иной контент, создаваемый вами на Платформе.',
          'Технические данные: IP-адрес, тип браузера, общая информация об устройстве, статистика использования и cookie-файлы.',
        ],
      },
      {
        h: '3. Цели использования',
        p: [
          'Данные используются для: предоставления сервиса и ведения вашего аккаунта; хранения смет и отчётов и их синхронизации между устройствами; технической поддержки; улучшения качества сервиса и статистического анализа; выполнения требований законодательства.',
          'Ваши данные не продаются третьим лицам в рекламных целях.',
        ],
      },
      {
        h: '4. Cookie и аналитика',
        p: [
          'Платформа использует cookie и localStorage для поддержания сессии (авторизации), запоминания языка и валюты.',
          'Для анализа трафика используется Google Analytics (идентификатор измерения G-1WZPY46RW1), собирающий обезличенную статистику. Вы можете отключить cookie в настройках браузера — это может повлиять на работу основных функций.',
        ],
      },
      {
        h: '5. Хранение и защита данных',
        p: [
          'Данные хранятся на защищённых серверах. Вся связь шифруется по HTTPS (TLS), пароли хранятся в виде необратимого хеша, данные каждой компании (тенанта) программно полностью изолированы от других.',
          'Доступ к данным предоставляется только уполномоченным сотрудникам в объёме, необходимом для обслуживания. Регулярно создаются резервные копии.',
        ],
      },
      {
        h: '6. Передача третьим лицам',
        p: [
          'Данные могут передаваться третьим лицам только в следующих случаях: по требованию уполномоченных государственных органов в предусмотренных законом случаях; после подключения платёжных сервисов (Payme, Click) — в минимальном объёме, необходимом для проведения платежа; хостинг- и инфраструктурным провайдерам — в рамках технического обеспечения сервиса.',
        ],
      },
      {
        h: '7. Ваши права',
        p: [
          'Вы имеете право на доступ к своим данным, их исправление, обновление или удаление. Для этого обратитесь на info.smeta.ai@gmail.com или воспользуйтесь настройками профиля.',
          'При удалении аккаунта ваши персональные данные удаляются по истечении установленных законом сроков хранения.',
        ],
      },
      {
        h: '8. Срок хранения и изменения политики',
        p: [
          'Данные хранятся в течение периода активности вашего аккаунта и срока, необходимого для оказания сервиса.',
          'В настоящую политику могут вноситься изменения. О существенных изменениях сообщается на Платформе; дата «Последнее обновление» вверху страницы актуализируется. Вопросы: info.smeta.ai@gmail.com.',
        ],
      },
    ],
  },
  terms: {
    title: 'Пользовательское соглашение',
    updated: 'Последнее обновление: 9 июля 2026 г.',
    metaDesc:
      'Пользовательское соглашение Smeta AI (smeta-ai.uz): условия сервиса, подписка, ограничение ответственности и права сторон.',
    sections: [
      {
        h: '1. Предмет соглашения',
        p: [
          'Smeta AI — онлайн-платформа для расчёта строительных смет с помощью искусственного интеллекта, управления проектами и расходами (smeta-ai.uz).',
          'Настоящее соглашение определяет условия использования Платформы. Регистрируясь, вы полностью принимаете условия соглашения.',
        ],
      },
      {
        h: '2. Регистрация и аккаунт',
        p: [
          'При регистрации вы обязаны указывать достоверные и актуальные данные. Вы несёте ответственность за конфиденциальность аккаунта и пароля — все действия, совершённые через ваш аккаунт, считаются вашими.',
          'Один аккаунт предназначен для одной компании (организации); внутри компании возможна работа пользователей с ролями (руководитель, менеджер, инженер).',
        ],
      },
      {
        h: '3. Правила использования',
        p: [
          'Платформу можно использовать в законных целях. Запрещается: попытки нарушения безопасности системы, несанкционированный доступ к данным других пользователей, автоматизированные запросы, наносящие вред сервису, использование Платформы для хранения противоправного контента.',
        ],
      },
      {
        h: '4. Тарифы и оплата',
        p: [
          'Сервис предоставляется на основе платной подписки. Действующие тарифы и цены публикуются в разделе «Тарифы» на главной странице и могут изменяться; изменения не затрагивают уже оплаченный период.',
          'Оплата в настоящее время принимается банковским переводом; после подключения онлайн-оплаты через Payme и Click дополнительно применяются условия соответствующих платёжных провайдеров.',
        ],
      },
      {
        h: '5. Важное предупреждение об AI-расчётах',
        p: [
          'Смета, рассчитанная AI, является ориентировочной. Она основана на введённых вами объёмах и ценах и предоставляется как вспомогательный инструмент. Для итоговой строительной сметы, тендерной документации или договорных обязательств рекомендуется проверка квалифицированным специалистом (сметчиком/инженером).',
          'Цены материалов в каталоге носят информационный характер и могут отличаться от реальных рыночных цен.',
        ],
      },
      {
        h: '6. Ограничение ответственности',
        p: [
          'Платформа предоставляется «как есть» (as is). Smeta AI не несёт ответственности за косвенные убытки (упущенная выгода, потеря контракта и т.п.), возникшие из-за неточностей в расчётах, изменения цен, некорректных данных, введённых пользователем, или временной недоступности сервиса.',
          'В любом случае совокупная ответственность Smeta AI ограничена суммой подписки, оплаченной пользователем за последние 12 месяцев.',
        ],
      },
      {
        h: '7. Интеллектуальная собственность',
        p: [
          'Платформа, её дизайн, программный код и название/логотип «Smeta AI» являются интеллектуальной собственностью администрации.',
          'Данные, которые вы вводите (сметы, проекты, отчёты), остаются вашими. Вы разрешаете Платформе хранить и обрабатывать их в целях оказания сервиса.',
        ],
      },
      {
        h: '8. Прекращение соглашения',
        p: [
          'Вы можете в любой момент запросить удаление аккаунта. Администрация вправе ограничить или приостановить аккаунт с предупреждением при грубом нарушении правил (раздел 3).',
          'При отмене подписки доступ к сервису сохраняется до конца оплаченного периода; возврат средств за неиспользованный период рассматривается индивидуально.',
        ],
      },
      {
        h: '9. Применимое право и контакты',
        p: [
          'К настоящему соглашению применяется законодательство Республики Узбекистан. Споры решаются прежде всего путём переговоров, а при недостижении согласия — в судах Республики Узбекистан.',
          'Контакты: info.smeta.ai@gmail.com · Ташкент, Узбекистан.',
        ],
      },
    ],
  },
};
