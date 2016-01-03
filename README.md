# GASMailQueue

## 概要
* GoogleSpreadSheet用のスクリプトです

## 準備

* メールキュー用に、下記のようなシートを作成する
  * 最初の2行はスクリプトが利用します
  * 全カラムを"表示形式"->"数字"->"書式なしテキスト"にしてください

| <使い方> | | | | | | |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 年月日 | 時分\* | 曜日 (0:日曜) | nの付く日 | 停止条件 | 件名\* | 本文\* |
| 2015/01/01 | 12:00 | | | | hello | world |

* 作業報告用に、下記のようなシートを作成する
  * 最初の2行はスクリプトが利用します

| 名前 | 体調 max5,min1 | 作業予定/報告 | 次回の作業予定 |
|:---:|:---:|:---:|:---:|
| system | | | |
| わたし | 5 | バグ修正 | ドラゴン討伐 |

* スクリプトを全てシートにコピーする
  * \*Config.jsは適宜編集すること
* トリガーを適宜設定する
  * メールキューは1分毎、朝/夜の作業報告は10分毎、リセットは2-3時に一度、程度がよい

## メールキューの使い方

* 年月日, 曜日, nの付く日はいずれかひとつ必須です
  * この順に評価し、値が設定されているひとつめのモードで処理します
* 年月日モードで発言したときのみ、行が削除されます
* 書式は次の通りです, 年月日 = 2015/05/09, 時分 = 04:08, 曜日 = 12345
* nの付く日に1を指定したとき、1,11,21,31日に発言します (10日は発言しません)
* 停止条件には、土日祝日は発言しない'dayoff'、祝日は発言しない'holiday'が指定できます

## SlackIncomingWebHooksモード

* IncomingWebHooksのURLを取得し、適宜設定することで、Slackに発言させることができます
* メールキューシートの"件名"は、発言先チャンネル名を意味するようになります
