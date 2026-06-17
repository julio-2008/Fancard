export const buildFanCardPrompt = (cardData: any) => {
  const heightRaw = cardData.height ? cardData.height.toString().replace(",", ".") : "";
  const height = heightRaw.length > 0 ? `${heightRaw} cm` : "";
  const weight = cardData.weight ? `${cardData.weight.toString().replace(".", ",")} kg` : "";
  const city = (cardData.city || "").toString().trim();
  const uf = (cardData.uf || "").toString().trim().toUpperCase();
  const team = (cardData.team || "").toString().trim();
  const cityUf = city && uf ? `${city}/${uf}` : (city || uf || "BRASIL");
  const teamOrLocation = team || cityUf;

  let prompt = `Use a IMAGEM 1 como template visual principal.

A tarefa e editar a IMAGEM 1, substituindo apenas o personagem central e os textos principais pelos novos dados.

Use a IMAGEM 2 como referencia da pessoa que vai entrar na figurinha.

Nao crie uma nova arte.
Nao redesenhe o layout.
Nao mude o fundo.
Nao mude a moldura.
Nao mude as cores.
Nao mude a camisa.
Nao aumente nem diminua a camisa.
Nao altere os elementos graficos ja existentes no template.
Nao adicione novos elementos.

A camisa da IMAGEM 1 deve permanecer exatamente no mesmo lugar, com o mesmo tamanho e o mesmo recorte.

A pessoa da IMAGEM 2 deve ser encaixada dentro da camisa da IMAGEM 1, como se estivesse usando aquela camisa originalmente.

Ajuste apenas corpo, pescoco, cabeca e rosto para encaixar de forma natural na camisa.

Nao deixar a cabeca pequena.
Nao deixar a cabeca grande demais.
Nao mostrar bracos extras.
Nao deformar o rosto.
Nao mudar a identidade da pessoa.
Preservar rosto, cabelo, tom de pele, expressao e aparencia natural da pessoa da IMAGEM 2.

O resultado precisa parecer uma figurinha realista, limpa e bem encaixada.

Substitua os textos atuais do template pelos novos dados:

Onde esta o nome atual, substituir por:
${cardData.name}

Onde esta a linha de dados atual, substituir por:
${cardData.birthDate} | ${height} | ${weight}

Onde esta o time, cidade ou escudo textual atual, substituir por:
${teamOrLocation}

Manter a mesma fonte, mesma cor, mesmo tamanho, mesmo alinhamento e mesmo estilo dos textos do template original.

Dados novos:
Nome: ${cardData.name}
Data de nascimento: ${cardData.birthDate}
Altura: ${height}
Peso: ${weight}
Cidade/UF escolhida: ${cityUf}
Time ou cidade que deve aparecer no card: ${teamOrLocation}
`;

  if (cardData.country) {
    prompt += `Selecao/Pais: ${cardData.country}\n`;
  }
  if (cardData.position) {
    prompt += `Posicao/Estilo: ${cardData.position}\n`;
  }

  prompt += `
Regra obrigatoria para textos:
Nunca escreva XX, N/A, undefined, cidade generica ou estado inventado.
Se o template tiver uma linha de time/cidade/UF, use exatamente: ${teamOrLocation}

Resultado final:
uma figurinha vertical, realista, organizada, com a pessoa da IMAGEM 2 perfeitamente encaixada no template da IMAGEM 1.`;

  return prompt;
};
