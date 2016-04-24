var SendMessage = (function() {
  // メッセージを送信する
  function exec(mode, subject, body, config) {
    switch (mode) {
      case 'mail':
        MailApp.sendEmail(config.mail, subject, body);
        break;

      case 'slack':
        new SlackWebHooks().send(
          config.slack.api_url,
          body,
          {
            channel:    subject,
            username:   config.slack.show_name,
            icon_emoji: config.slack.show_icon,
            link_names: 1,
          }
        );
        break;
    }
  }

  return {
    exec: exec,
  };
})();
