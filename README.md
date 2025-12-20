# Emanuele Del Monte - Portfolio

[![Netlify Status](https://api.netlify.com/api/v1/badges/fdf854ce-9fd0-442d-8e79-9cedb4bd8100/deploy-status)](https://app.netlify.com/sites/emanueledelmonte/deploys)

Portfolio personale minimalista sviluppato con **Gatsby** e **React**. Il progetto utilizza il tema `gatsby-theme-portfolio-minimal` personalizzato.

## 🛠 Tech Stack

*   **Framework**: Gatsby v5
*   **UI Library**: React v18
*   **Styling**: Custom CSS / Theme styling
*   **Deployment**: Netlify

## 🚀 Getting Started

### Prerequisiti
Assicurati di avere installato **Node.js** (versione >= 18.0.0).

### Installazione

1.  Clona la repository:
    ```bash
    git clone <repository-url>
    cd Portfolio-minimal
    ```

2.  Installa le dipendenze:
    ```bash
    npm install
    # Se incontri conflitti di dipendenze (utili con versioni legacy npm):
    npm install --legacy-peer-deps
    ```

3.  Avvia il server di sviluppo:
    ```bash
    npm run develop
    ```
    Il sito sarà accessibile su `http://localhost:8000`.

## 📂 Struttura dei Contenuti

I contenuti del sito sono gestiti tramite file JSON e Markdown situati nella cartella `content/sections`.
Le sezioni principali modificabili sono:

*   `hero/hero.json`: Titolo e introduzione.
*   `about/about.md`: Descrizione "About me".
*   `projects/projects.json`: Lista dei progetti mostrati.
*   `contact/contact.json`: Informazioni di contatto e link social.

## 🎨 Note sulle Immagini

Le immagini dei progetti sono screenshot acquisiti a risoluzione **1080x810** e processati tramite [Screely](https://www.screely.com/) con i seguenti settaggi:
* **Window Type**: Plain Window
* **Window Style**: Regular 
* **Padding Vertical**: 100px
* **Padding Horizontal**: 100px
