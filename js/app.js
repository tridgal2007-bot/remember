
// ENVIO DIRETO DE MENSAGENS — RELATOS ENGARRAFADOS
const replyForm = document.getElementById("replyForm");

replyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("reply").value.trim();
    const status = document.getElementById("replyStatus");
    const button = replyForm.querySelector('button[type="submit"]');

    if (!message) {
        status.textContent = "Escreva uma mensagem primeiro.";
        return;
    }

    button.disabled = true;
    status.textContent = "Enviando mensagem...";

    try {
        const response = await fetch(
            "https://formsubmit.co/ajax/lokiatgardiano@gmail.com",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    name: "Sophia",
                    subject: "Nova mensagem — Relatos Engarrafados",
                    message: message,
                    _captcha: "false",
                    _template: "table"
                })
            }
        );

        const result = await response.json();

        if (!response.ok || result.success !== "true") {
            throw new Error("Falha no envio.");
        }

        status.textContent = "Mensagem enviada com sucesso!";
        replyForm.reset();

    } catch (error) {
        status.textContent = "Não foi possível enviar. Tente novamente.";
        console.error(error);

    } finally {
        button.disabled = false;
    }
});
