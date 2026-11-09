
document.addEventListener('DOMContentLoaded', () => {

    // LOGIN DEMONSTRATIVO
    const form = document.getElementById('form-acesso');
    const email = document.getElementById('email');
    const senha = document.getElementById('senha');
    const botao = document.getElementById('botao-acesso');

    if (form && email && senha && botao) {

        function atualizarBotao() {
            botao.disabled = !(
                email.value.trim() && senha.value.trim()
            );
        }

        email.addEventListener('input', atualizarBotao);
        senha.addEventListener('input', atualizarBotao);

        atualizarBotao();

        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const perfil = document.querySelector(
                'input[name="perfil"]:checked'
            )?.value;

            window.location.href = perfil === 'fablab'
                ? 'html/fablab.html'
                : 'html/aacd.html';
        });
    }

    // BOTÃO SAIR
    const sair = document.getElementById('botao-sair');

    if (sair) {
        sair.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = '../index.html';
        });
    }

});
