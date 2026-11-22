


# language: pt

Funcionalidade: Validação dos dados de impressoras
  Como usuário da plataforma
  Quero cadastrar impressoras com dados válidos
  Para garantir a qualidade das informações cadastradas

  Cenário: Aceitar uma tecnologia permitida
    Dado que preparo os dados de uma impressora
    Quando informo a tecnologia FDM
    Então a validação deve aceitar os dados

  Cenário: Rejeitar uma tecnologia inválida
    Dado que preparo os dados de uma impressora
    Quando informo a tecnologia LASER
    Então a validação deve rejeitar os dados

  Cenário: Exigir os campos obrigatórios
    Dado que preparo os dados de uma impressora
    Quando deixo marca, modelo e tecnologia vazios
    Então a validação deve indicar os campos obrigatórios

