# gdgoc-opencampus-guess-the-ai-image

本プロジェクトは、AIによって生成された画像を見破るクイズアプリケーション、およびそのデータセットを構築するためのPythonスクリプトから成るプロジェクトです。

## ディレクトリ・ファイル構成

project-root/
- prepare/
  データセットを作成するためのPython環境です。
  - .venv/
    Pythonの仮想環境です。
  - raw_images/
    ウェブから取得した未加工の元画像が格納されます。
  - output_images/
    加工済み（ウォーターマークやメタデータが付与されたもの）の画像が出力されます。
    - answers.txt
      どの画像がAI生成のものであるかを示す正答リストです。
  - scripts/
    画像生成処理を実行するPythonスクリプト群です。
    - download.py
      画像を一括でダウンロードするスクリプトです。
    - watermark.py
      拡散スペクトル方式のノイズ（不可視ウォーターマーク）を加算するスクリプトです。
    - exif.py
      ExifのMakerNoteタグに特定の文字列データを埋め込むスクリプトです。

- handson/
  体験用のフロントエンドアプリケーション（Vite + TypeScript）です。
  - public/
    画像アセットなどが配置されます。
    - images/
      クイズで出題される画像群です（prepare/output_images/ からコピーされたものです）。
  - src/
    アプリケーションのソースコードです。
    - main.ts
      状態管理やUIの構築を行うメインロジックです。
    - detector.ts
      画像のメタデータ解析（exifr）やピクセル解析（TensorFlow.jsによる相関計算のモック）を担当するモジュールです。
    - style.css
      アプリケーションのスタイルシートです。
  - index.html
    フロントエンドのエントリーポイントとなるHTMLです。

## 開発環境の立ち上げ

1. データセットの準備
prepareディレクトリで `uv` を用いて依存関係を解決し、各種スクリプトを実行してください。生成された画像はhandson/public/images/に配置します。

2. フロントエンドの起動
handsonディレクトリ内で `pnpm install` を実行し、`pnpm dev` でローカルサーバーを起動します。
