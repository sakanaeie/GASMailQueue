var SlackWebHooks = (function() {
  // constructor ---------------------------------------------------------------
  function SlackWebHooks() {
  }

  // public --------------------------------------------------------------------
  function send(url, text, extend_payload) {
    // ペイロードを構築する
    var payload = {};
    if ('object' === typeof extend_payload) {
      payload = extend_payload;
    }
    payload.text = text;

    // UrlFetchのオプションを構築する
    var options = {
      method:  'post',
      payload: {
        payload: JSON.stringify(payload),
      },
    };

    // 送信する (リトライ付き)
    var i = 0;
    while (i++ < 5) {
      try {
        UrlFetchApp.fetch(url, options);
        break;
      } catch (e) {
        if (
             -1 !== e.message.indexOf('Exception: タイムアウト: ')
          || -1 !== e.message.indexOf('Exception: 予期しないエラー: ')
          || -1 !== e.message.indexOf('Exception: 使用できないアドレス: ')
        ) {
          // よくある例外は、5秒の待ちを挟んで再実行する
          Utilities.sleep(5000);
        } else {
          // よくない例外は、上に投げる
          throw e;
        }
      }
    }
  }

  SlackWebHooks.prototype = {
    constructor: SlackWebHooks,
    send: send,
  };

  return SlackWebHooks;
})();
