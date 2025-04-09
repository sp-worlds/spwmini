<div align="center">

# SPWMini

[![NPM Version](https://img.shields.io/npm/v/spwmini)](https://www.npmjs.com/package/spwmini) [![NPM
downloads](https://img.shields.io/npm/dm/spwmini)](https://www.npmjs.com/package/spwmini)

</div>

<table>
<tr><td align="center" width="2000"><b>
<a href="https://spworlds.ru">SPWorlds</a> •
<a href="https://github.com/sp-worlds/api-docs/wiki">SPWorlds API</a> •
<a href="https://discord.gg/HdaVZ2g6nw">Discord</a>
</b></td></tr>
<tr><td align="center" width="2000"><b>
<a href="#установка">Установка</a> •
<a href="#клиентская-часть">Клиент</a> •
<a href="#серверная-часть">Сервер</a> •
<a href="#набор-типов">Типы</a> •
<a href="#уголок-безопасности">Безопасность</a>
</b></td></tr>
</table>

SPWMini - Библиотека для создания мини приложений для сайта SPWorlds.

Она состоит из клиентской части, серверной части и набора типов.

## Установка

Ты умеешь устанавливать пакеты своим любимым менеджером пакетов. Наш называется `spwmini`.

```bash
npm install spwmini

yarn add spwmini

pnpm install spwmini
```

## Клиентская часть

Пакет предоставляет импорт класса `SPWMini` из `spwmini/client`

```ts
import SPWMini from 'spwmini/client';
```

### Инициализация

Инициализация класса требует обязательный аргумент - ID приложения, который можно взять со страницы `/[server]/apps/`**[id-приложения]**.

```ts
const spm = new SPWMini('123e4567-e89b-12d3-a456-426655440000');
```

При работе с фреймворками, опционально, можно отключить автоматическую инициализацию, чтобы предупредить работу с `window` до появления возможности его использования.

Метод `initialize` позволит произвести инициализацию в нужный момент, а метод `dispose` - удалить все хендлеры по необходимости.

```ts
const spm = new SPWMini('123e4567-e89b-12d3-a456-426655440000', {
  autoinit: false
});

onMounted(() => spm.initialize());
onUnmounted(() => spm.dispose());
```

Так как для валидации данных о пользователе требуется запрос к серверу, отдельной опцией может быть кастомизирован и метод `fetch`.

```ts
const spm = new SPWMini('123e4567-e89b-12d3-a456-426655440000', {
  customFetch: ofetch
});
```

### Общение с SPWorlds

Во время инициализации сразу же на SPWorlds отправляется запрос `init` с id приложения.

Если id запущенного приложения и вашего совпадут, в ответ будет отправлено сообщение `initResponse` с данными о пользователе. Иначе - `initError` с данными об ошибке.

Все сообщения прослушиваются с помощью метода `on` или `addEventListener`.

```ts
spm.on('initResponse', user => {
  console.log(`Logged in as ${user.username} / ${user.minecraftUUID}`);
});

spm.on('initError', message => console.error(`Log in error: ${message}`));
```

Сразу после инициализации и события `ready` данные о пользователе доступны как параметр `user`.

```ts
spm.on('ready', () => {
  console.log('App is ready!');
  console.log('Current user:', spm.user);
})
```

Все описанные далее методы будут работать только после инициализации приложения (после события `initResponse` или `ready`).

### Валидация пользователя

Так как эти данные может легко подделать любой пользователь, предоставлен и метод валидации информации, отправляющий запрос к API и тесно связанный с серверной частью этого пакета.

Метод `validateUser` принимает URL и опциональные параметры `fetch`. Он делает запрос к бекенду, передавая информацию о пользователе.

Бэкенд должен вернуть простой текстовый ответ, содержащий число `1` в случае, если всё хорошо и `0` в случае, если пользователь подделан. Подробнее в [секции про серверную часть](#действительно-middleware).

```ts
const isUserValid = await spm.validateUser('/validate');

const isUserValid = await spm.validateUser('/validate', { credentials: 'include' });
```

### Открытие URL в новом окне

Для открытия ссылки в новом окне используется метод `openURL`. Он принимает только ссылки с протоколом `https://`. Вызов метода с валидной ссылкой открывает диалоговое окно, предлагающее пользователю перейти по ссылке.

```ts
spm.openURL('https://google.com');
```

В случае успеха будет отправлен ответ `openURLResponse` со строкой `success`. Любую ошибку открытия можно поймать событием `openURLError` и получить строку с информацией о ней.

```ts
spm.on('openURLResponse', () => console.log('Окно открытия URL успешно открыто'));
spm.on('openURLError', err => console.error(`Ошибка запроса окна открытия URL: ${err}`));
```

### Окно оплаты

Открытие окна оплаты требует создание заранее транзакции и получение кода от API SPWorlds. Затем, достаточно передать этот код в метод `openPayment` и у пользователя откроется окно оплаты.

```ts
const payment = await fetch('/api/buyPremium').then(r => r.json());
spm.openPayment(payment.code);
```

> [!WARNING]
> Для корректной работы, создаваться транзация должна с `redirectUri` со значением `#MINIAPP`

*Да, нужно на сервере самостоятельно создать транзакцию. Для этого можно воспользоваться либо [эндпоинтом API SPWorlds напрямую](https://github.com/sp-worlds/api-docs/wiki/%D0%9E%D0%BF%D0%BB%D0%B0%D1%82%D0%B0-%D0%BD%D0%B0-%D0%B2%D0%B0%D1%88%D0%B5%D0%BC-%D1%81%D0%B0%D0%B9%D1%82%D0%B5), либо одной из [библиотек, созданных коммьюнити](https://github.com/sp-worlds/api-docs/wiki/Библиотеки).*

<br />

Оплата состоит из двух этапов, так что и пар событий две: открытие окна оплаты и сама оплата.

Событие `openPaymentReponse` со строкой `success` отправляется при удачном открытии окна, иначе - `openPaymentError` со строкой, содержащей информацию об ошибке. Например, транзакция по коду уже оплачена или срок оплаты истёк.

```ts
spm.on('openPaymentReponse', () => console.log('Окно успешно открыто, ждём оплату'));
spm.on('openPaymentError', err => console.error(`Не удалось открыть окно оплаты: ${err}`));
```

Событие `paymentResponse` со строкой `success` отправляется при удачной оплате пользователем товара. Это не значит, что нужно верить, что товар оплачен, стоит проверить это и на бэкенде, но это позволит фронтенду знать, что проверить уже пора. (Хотя, наверное, перед проверкой стоит подождать секунду-другую, пока хук до твоего бекенда дойдёт и обработается)

```ts
spm.on('paymentReponse', async () => {
  console.log('Оплата успешно произведена');

  const premiumStatus = await fetch('/api/premium').then(r => r.json());
  if (premiumStatus.active)
    user.showShinyBadge = true;
});
```

В случае же ошибки оплаты, например, если средств недостаточно, это будет отправлено событием `paymentError` в виде строки, как и в случае любого другого события ошибки.

```ts
spm.on('openPaymentError', err => console.error(`Оплатить не удалось! Ошибка: ${err}`));
```

В случае ошибки новую транзакцию создавать не нужно. Стоит предложить пользователю попробовать оплатить ещё раз и запросить открытие окна оплаты с тем же кодом.

## Серверная часть

Из `spwmini/middleware` могут быть импортированы функции, помогающие с валидацией пользователя.

### Действительно middleware

Функция `spwmValidate` принимает как обязательный аргумент токен приложения и как опциональный - настройки. Возвращает она другую функцию, уже используемую как посредник.

Токен выдаётся сразу после создания приложения и показывается только один раз. Чтобы получить новый, потребуется удалить приложение, создать его заново и придётся заново проходить модерацию.

Возвращаемая функция-посредник принимает http2 запрос и http2 ответ аргументами, а потому может быть встроена посредником как в http2 сервер, так в express.js сервер и иные.

Для корректной работы в случае с express.js, она должна быть встроена как можно раньше, до применения трансформации тела запроса в json, так как она обрабатывает его самостоятельно.

*Наверное это нужно переделать, сделать лучше, но неизвестно как. Контрибуторство приветствуется.*

```ts
import express from 'express';
import { validate } from 'spwmini/middleware';

const app = express();
app.use('/validate', validate('SECRET_TOKEN'));
app.use(express.json());
```

После подобного применения посредника, его URL можно указать в [клиентской части](#валидация-пользователя) для проверки пользователя.

Единственной настройкой этой функции является отключение проверки метода. По умолчанию функция принимает только `POST` запросы, отклоняя любые другие методы. Указав для `checkPostMethod` значение `false`, можно позволить посреднику принимать вообще любые методы.

```ts
// Принимает совершенно любые методы
app.use('/validate', validate('SECRET_TOKEN', { checkPostMethod: false }));

// Принимает только метод PUT
app.put('/validate', validate('SECRET_TOKEN', { checkPostMethod: false }));

// Отклоняет PUT запросы с ошибкой, другие методы не принимает
app.put('/validate', validate('SECRET_TOKEN'));
```

### Только проверка

Функция `checkUser` принимает пользователя, имеющегося на клиенте после инициализации, и секретный токен приложения. Возвращается логическое значение, означающее валидность информации о пользователе, что ни одна часть структуры не подменена.

```ts
import express from 'express';
import { checkUser } from 'spwmini/middleware';

const app = express();
app.use(express.json());

app.use('/validate-user', (req, res) => {
  if (!req.body.user || typeof req.body.user !== 'object')
    return res.status(400).send({ message: "Invalid user provided" });

  res.send({ valid: checkUser(req.body.user) })
});
```

## Набор типов

Все типы импортируются из `spwmini/types`.

«Это немного, но это честная работа».


## Уголок безопасности

Чтобы ваш сайт невозможно было использовать внутри других сайтов, кроме spworlds, нужно написать в `<head>` элементе:

```html
<meta http-equiv="Content-Security-Policy" content="frame-ancestors https://spworlds.ru;">
```

Благодаря одной лишь этой строчке вы легко сделаете свой сайт безопаснее.

После `https://spworlds.ru` через пробел можно указать и свой сайт, если это где-то требуется для тестирования:

```html
<meta http-equiv="Content-Security-Policy" content="frame-ancestors https://spworlds.ru https://example.com;">
```

А если есть возможность модифицировать заголовки запросов, можно для фронтенда сайта указать

```http
X-Frame-Options: ALLOW-FROM https://spworlds.ru https://example.com
```

