# ⚽ FanCard Brasil | Figurinhas de Copa Personalizadas

<div align="center">

<!-- Início da Logo/Card Animado em SVG que se transforma no README -->
<svg width="320" height="380" viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" style="background: transparent; font-family: 'DM Sans', sans-serif;">
  <style>
    @keyframes cardFloat {
      0% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(1deg); }
      100% { transform: translateY(0px) rotate(0deg); }
    }
    @keyframes goldGlow {
      0% { stop-color: #f4c430; opacity: 0.8; }
      50% { stop-color: #0d5f38; opacity: 1; }
      100% { stop-color: #164ea6; opacity: 0.8; }
    }
    @keyframes shineEffect {
      0% { left: -150%; }
      50% { left: 150%; }
      100% { left: 150%; }
    }
    @keyframes morphText {
      0%, 100% { content: "ENVIE SUA FOTO"; opacity: 1; }
      33% { content: "AJUSTE OS ATRIBUTOS"; opacity: 1; }
      66% { content: "CONSTRUA SEU CARD!"; opacity: 1; }
    }
    .main-card {
      animation: cardFloat 5s ease-in-out infinite;
      transform-origin: center;
    }
    .glow-stop {
      animation: goldGlow 6s infinite;
    }
    .dynamic-label::after {
      content: "CRIE SUA FIGURINHA";
      animation: morphText 9s infinite;
      font-family: inherit;
    }
  </style>

  <!-- Definição de Gradientes e Efeitos -->
  <defesas>
    <gradiente linear eu ia="cartãoBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <parar desvio="0%" parar de cor="#083f28" />
      <parar desvio="50%" parar de cor="#052214" />
      <parar desvio="100%" parar de cor="#021009" />
    </gradiente linear>
    <gradiente linear eu ia="borda dourada" x1="0%" y1="0%" x2="100%" y2="100%">
      <parar aula="parada de brilho" desvio="0%" parar de cor="#f4c430" />
      <parar desvio="100%" parar de cor="#d4af37" />
    </gradiente linear>
    <filtro eu ia="sombra" x="-10%" e="-10%" largura="120%" altura="120%">
      <feDropShadow dx="0" você="16" desvio padrão="12" cor de inundação="#083f28" opacidade de inundação="0.35"/>
    </filtro>
  </defesas>

  <!-- Corpo do Card Animado -->
  <g aula="cartão principal" filtro="url(#sombra)">
    <!-- Base de Fundo do Card -->
    <correto x="20" e="20" largura="280" altura="340" RX="20" preencher="url(#cartãoBg)" AVC="url(#goldBorder)" largura do traço="4" />
    
    <!-- Linhas decorativas internas (estilo tático de copa) -->
    <caminho d="M 30 70 L 290 70" acidente vascular cerebral="rgba(244,196,48,0.2)" largura do curso="1" />
    <caminho d="M 30 310 L 290 310" acidente vascular cerebral="rgba(244,196,48,0.2)" largura do curso="1" />
    <circle cx="160" cy="180" r="70" acidente vascular cerebral="rgba(244,196,48,0.1)" acidente vascular cerebral-width="1.5" fill="none" />
    
    <!-- Escudo Principal centralizado brilhante -->
    <pontos de polígono = "160,85 200.105 190.165 160.185 130.165 120.105" fill = "rgba (244, 196, 48, 0,15)" acidente vascular cerebral = "#f4c430" largura de curso = "2" />
    
    <!-- Ícone ou Silhueta de Jogador -->
    <caminho d = "M 160 115 C 168 115, 174 121, 174 129 C 174 137, 168 143, 160 143 C 152 143, 146 137, 146 129 C 146 121, 152 115, 160 115 Z M 135 168 C 135 155, 146 150, 160 150 C 174 150, 185 155, 185 168" acidente vascular cerebral = "#f4c430" largura de curso = "2" curso-linecap = "redondo" preenchimento = "nenhum" />

    <!-- Textos Estilizados do Card -->
    <text x="160" y="55" fill="#f4c430" font-size="10" font-weight="900" letter-spacing="4" text-anchor="middle" style="text-shadow: 0 2px 4px rgba(0,0,0,0.5);">EDICAO LIMITADA</text>
    
    <text x="160" y="225" fill="#ffffff" font-size="17" font-weight="800" text-anchor="middle">VOCÊ NA COPA</text>
    <text x="160" y="248" fill="#f4c430" font-size="12" font-weight="600" letter-spacing="2" text-anchor="middle">99 OVR</text>
    
    <!-- Indicadores de Atributos Táticos -->
    <text x="60" y="290" fill="rgba(255,255,255,0.7)" font-size="9" text-anchor="middle">PAC 99</text>
    <text x="110" y="290" fill="rgba(255,255,255,0.7)" font-size="9" text-anchor="middle">SHO 99</text>
    <text x="160" y="290" fill="rgba(255,255,255,0.7)" font-size="9" text-anchor="middle">PAS 99</text>
    <text x="210" y="290" fill="rgba(255,255,255,0.7)" font-size="9" text-anchor="middle">DRI 99</text>
    <text x="260" y="290" fill="rgba(255,255,255,0.7)" font-size="9" text-anchor="middle">PHY 99</text>

    <!-- Botão Dinâmico do README que sinaliza transformação -->
    <rect x="60" y="325" largura="200" altura="24" rx="12" fill="#f4c430" />
    <text class="dynamic-label" x="160" y="341" fill="#083f28" font-size="9.5" font-weight="800" text-anchor="middle" letter-spacing="0.5"></text>
  </g>
</SVG>
<!-- Fim da Logo/Card Animado -->

### Monte sua escalação, envie sua foto e receba sua figurinha personalizada estilo Copa do Mundo de Alta Fidelidade! 🏆🏆🏆

[![Licença MIT](https://img.shields.io/badge/licenca-MIT-0d5f38.svg)](LICENÇA)
[![Rapidamente](https://img.shields.io/badge/Vite-6236FF?style=flat&logo=vite&logoColor=white)](https://vite.dev)
[![Reagir](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev)
[![MercadoPago](https://img.shields.io/badge/Checkout_Pro-Mercado_Pago-009EE3?style=flat)](https://www.mercadopago.com.br/developers)

</divisão>

---

## 🌟 Sobre o Projeto
**FanCard Brasil** é uma aplicação Full-Stack interativa projetada para transformar fotos reais de torcedores em figurinhas físicas e digitais de qualidade profissional. Através de um painel de recorte e personalização minucioso, o usuário configura seus próprios atributos de jogador (Ritmo, Chute, Passe, Drible, Defesa, Físico) e faz seu pedido que é processado em tempo real por uma equipe ágil com suporte a faturamento integrado via **Mercado Pago Checkout Pro**.

## 🛠️ O Processo de Criação (Como Funciona)
[ Escolha o seu Pacote ] ➜ [ Envio da sua Foto ] ➜ [ Ajuste dos Atributos ]
│
[ Painel Administrativo ] ⎿ [ Pagamento via Checkout Pro ] <────┘
│ (Designer envia arte tratada)
▼
[ Página de Status de Pedido ] ➜ 💥 [ Liberação para download e envio físico! ]
código
Código
1. **Escolha de Pacotes**: Pacote digital de alta definição ou pacotes físicos com envio diretamente para a residência do comprador.
2. **Upload & Validação de Foto**: Upload otimizado com feedback instantâneo de tamanho e enquadramento.
3. **Personalização Estatística**: Controle preciso sob os números do verso e frente de seu card de colecionador.
4. **Checkout Automático**: Pagamento fluido por PIX, Cartão ou Boleto configurado pelo Mercado Pago.
5. **Painel de Produção & Acompanhamento**: Uma página dedicada com atualizações de status automáticas conforme designers reais tratam e recortam sua imagem.

---

## 💰 Pacotes & Preços

Experimente a emoção de se ter estampado na figurinha épica por valores pensados para qualquer torcedor:

*   **🏆 Pacote Estrela Digital**: Receba o arquivo em Altíssima Definição (HD) para postar, imprimir por conta própria e usar de avatar por apenas **R$ 14,90**.
*   **📦 Pacote Campeão Físico**: Duas figurinhas impressas em papel fotográfico adesivo premium laminadas brilhantes com corte perfeito enviadas com frete gratuito por **R$ 29,90**.
*   **💎 Pacote Seleção Completa**: Cinco unidades físicas de alta definição + Arquivo profissional HD para impressões ilimitadas por apenas **R$ 49,90**.

---

## 🚀 Arquitetura e Diferencial Tecnológico

Diferente de sistemas meramente estáticos, o **FanCard Brasil** possui um motor full-stack eficiente para evitar falhas de comunicação e garantir transações seguras:

*   **Front-end**: React 19 estruturado com animações exclusivas usando `movimento` e estilização premium baseada nas cores da bandeira nacional brasileira com Tailwind CSS.
*   **Back-end (servidor de mecanismo)**: API Express robusta responsável por gerenciar credenciais criptografadas, persistir os pedidos gerados e intermediar com precisão as notificações instantâneas de pagamento (IPN/Webhooks) do Mercado Pago sem expor chaves sensíveis ao cliente.
