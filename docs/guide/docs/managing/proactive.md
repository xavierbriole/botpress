---
id: proactive
title: Acting Proactively
---

## Overview

You may wish to make your chatbot act proactively on your website in response to an action or event. A common requirement is to make the chatbot speak first. 

Other use cases include a welcome message informing visitors that they are talking to a chatbot, suggesting a product purchase after the visitor views it for a set time, or asking for feedback on services they were using.

## Requirements

### Send an event from the webpage

First, you need to open the webchat (either manually or programmatically) and then send an event from the webpage.

> 📖 How do I open the webchat? Please refer to the [channel-web](../channels/web#embedding) section.

```js
window.botpressWebChat.sendEvent({
  type: 'proactive-trigger',
  channel: 'web',
  payload: {
    text: 'fake message'
  }
})
```

The property `type: 'proactive-trigger'` is used to identify the event so that Botpress can catch it and act on it later on.

### Catch the event in a hook

Botpress receives an event from your website, so you need to add a handler for it. If this event is not handled, it will be interpreted as a user message.

This snippet should be added to the [before_incoming_middleware hook](../main/code#before-incoming-middleware):

> **Tip**: Use `event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)` to tell the dialog engine to skip the event processing. This code is useful when your event is not a user message.

```js
function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent) {
  /** Your code starts below */
  // Catch the event sent from the webpage
  if (event.type === 'proactive-trigger') {
    event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, false)
  }

  /** Your code ends here */
}
```

## Webchat events

There are four events that Botpress can catch on your page:

| name            | Description                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| `webchatLoaded` | Triggered when the webchat is loaded and ready to be opened                   |
| `webchatOpened` | Triggered when the webchat button bubble is clicked                           |
| `webchatClosed` | Triggered when the webchat close button is clicked                            |
| `webchatReady`  | Triggered when the webchat is ready to accept events, like proactive triggers |

## Common use cases

Here are some examples of how you can use webchat events on your page.

### Send a message when the webchat is loaded

Doing this will send an event when the webchat is loaded and ready to be opened.

Use this code in your `index.html`:

```html
<html>
  <head>
    <title>Embedded Webchat</title>
    <script src="/assets/modules/channel-web/inject.js"></script>
  </head>

  <body>
    This is an example of embedded webchat
  </body>

  <script>
    // Initialize the chat widget
    // Change the `botId` with the Id of the chatbot that should respond to the chat
    window.botpressWebChat.init({
      host: 'http://localhost:3000',
      botId: 'welcome-bot'
    })

    window.addEventListener('message', function(event) {
      if (event.data.name === 'webchatReady') {
        window.botpressWebChat.sendEvent({
          type: 'proactive-trigger',
          channel: 'web',
          payload: { text: 'fake message' }
        })
      }
    })
  </script>
</html>
```

### Send a message when opening webchat

Doing so will send an event when the webchat button bubble is clicked.

Use this code in your `index.html`:

```html
<html>
  <head>
    <title>Embedded Webchat</title>
    <script src="/assets/modules/channel-web/inject.js"></script>
  </head>

  <body>
    This is an example of embedded webchat
  </body>

  <script>
    // Initialize the chat widget
    // Change the `botId` with the Id of the chatbot that should respond to the chat
    window.botpressWebChat.init({
      host: 'http://localhost:3000',
      botId: 'welcome-bot'
    })

    window.addEventListener('message', function(event) {
      if (event.data.name === 'webchatOpened') {
        window.botpressWebChat.sendEvent({
          type: 'proactive-trigger',
          channel: 'web',
          payload: { text: 'fake message' }
        })
      }
    })
  </script>
</html>
```

### Send custom content on proactive event

You can intercept a proactive trigger to send custom content. This could be used to send reminders, display a welcome message, or ask for feedback.

- Make sure that you've sent an event from your webpage. See the examples above.
- Use this in your `before_incoming_middleware` hook:

```js
// Catch the event
if (event.type === 'proactive-trigger') {
  const eventDestination = {
    channel: event.channel,
    target: event.target,
    botId: event.botId,
    threadId: event.threadId
  }

  // Skip event processing
  event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)

  // Make the chatbot respond with custom content instead
  bp.cms.renderElement('builtin_text', { text: "I'm so proactive!", typing: true }, eventDestination).then(payloads => {
    bp.events.replyToEvent(event, payloads)
  })
}
```

Here we're using the [replyToEvent](https://botpress.com/reference/modules/_botpress_sdk_.events.html#replytoevent) function from the SDK to reply to the current event and [renderElement](https://botpress.com/reference/modules/_botpress_sdk_.cms.html#renderelement) to render our custom content.

### Send proactive only to new users

When you want to respond only to new users, you have to check if their session is new. We can do that by looking at the session's last messages.

- Make sure that you've sent an event from your webpage. See the examples above.
- Use this code in your `before_incoming_middleware` hook:

```js
if (event.type === 'proactive-trigger') {
  // We only want to trigger a proactive message when the session is new,
  // otherwise the conversation will progress every time the page is refreshed.
  if (event.state.session.lastMessages.length) {
    // This will tell the dialog engine to skip the processing of this event.
    event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)
  }
}
```

## Live Examples

If you'd like to play around with proactive triggers, we provide a chatbot and some examples to interact with. These examples are probably the best way to learn everything you can do with proactive triggers.

See how to install the Proactive Module [here](https://github.com/botpress/botpress/tree/master/examples/proactive).
