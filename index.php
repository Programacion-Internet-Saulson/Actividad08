<!DOCTYPE html>
<html>
<head>
  <meta charset=utf-8>
  <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="src/css/style.css"/>
  <link href='https://fonts.googleapis.com/css?family=Playfair+Display:400,700,700italic' rel='stylesheet' type='text/css'>
  <script type="text/javascript" src="src/js/TweenMax.min.js"></script>
  <script type="text/javascript" src="src/js/three.js"></script>
  <script type="text/javascript" src="src/js/index.js"></script>
  <title>Trabajo 08</title>
</head>
<body>
  <div class="game-holder" id="gameHolder">
    <div class="header">
      <h1>
        <span>the</span>
        Volador
      </h1>
      <h2>Vuela hasta el final</h2>
      <div class="score" id="score">
        <div class="score__content" id="level">
          <div class="score__label">Nivel</div>
          <div class="score__value score__value--level" id="levelValue">1</div>
          <svg class="level-circle" id="levelCircle" viewbox="0 0 200 200">
            <circle id="levelCircleBgr" r="80" cx="100" cy="100" fill="none"
              stroke="#d1b790" stroke-width="24px"/>
            <circle id="levelCircleStroke" r="80" cx="100" cy="100" fill="none"
              #f25346 stroke="#fed700" stroke-width="14px" stroke-dasharray="502"/>
          </svg>
        </div>
        <div class="score__content" id="dist">
          <div class="score__label">Distancia</div>
          <div class="score__value score__value--dist" id="distValue">000</div>
        </div>
        <div class="score__content" id="energy">
          <div class="score__label">Energía</div>
          <div class="score__value score__value--energy" id="energyValue">
            <div class="energy-bar" id="energyBar"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="world" id="world"></div>
    <div class="message message--replay" id="replayMessage">
      Click Para Reiniciar
    </div>
    <div class="message message--instructions" id="instructions">
      Consigue las monedas
      <span>Esquiva las bolas de lava</span>
    </div>
  </div>
</body>
</html>