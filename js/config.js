/*
  CONFIGURAÇÕES GERAIS — EDITE ESTE ARQUIVO PARA AJUSTAR O SITE.
*/
window.RELATOS_CONFIG = Object.freeze({
  // Senha da tela inicial. Não diferencia letras maiúsculas/minúsculas.
  passwords: ["sofi", "sophia"],

  // Para onde vai a resposta escrita na seção de Sophia.
  replyEmail: "lokiatgardiano@gmail.com",

  // Coloque a música em sound/musica.mp3.
  musicPath: "sound/musica.mp3",
  // Volume inicial (0.12 = 12%). Altere entre 0 e 1 se desejar.
  musicVolume: 0.12,

  // Tempo de cada clima antes de passar para o próximo (milissegundos).
  weatherInterval: 25000,
  weatherModes: ["sun", "rain", "storm", "snow"],

  // Frases que o papagaio fala.
  parrotGreeting: "Arrr! Tem histórias que o mar não deixou afundar.",
  parrotOpenMessage: "Encontrei a garrafa {id}: {title}. Está pronta para abrir!",

  // Nomes exibidos nos filtros.
  categoryLabels: {
    sofi: "Sofi",
    manu: "Manu",
    pessoal: "Pessoal"
  }
});
