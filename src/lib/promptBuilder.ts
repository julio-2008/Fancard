export const buildFanCardPrompt = (cardData: any) => {
  // Formatação segura: Altura em cm, peso em kg
  const heightRaw = cardData.height ? cardData.height.toString().replace(',', '.') : "";
  const height = heightRaw.length > 0 ? `${heightRaw} cm` : "";
  const weight = cardData.weight ? `${cardData.weight.toString().replace('.', ',')} kg` : "";
  const cityUf = cardData.city && cardData.uf ? `${cardData.city}/${cardData.uf}` : (cardData.city || "");
  
  let prompt = `Use a IMAGEM 1 como template visual principal.

A tarefa é editar a IMAGEM 1, substituindo apenas o personagem central e os textos principais pelos novos dados.

Use a IMAGEM 2 como referência da pessoa que vai entrar na figurinha.

Não crie uma nova arte.
Não redesenhe o layout.
Não mude o fundo.
Não mude a moldura.
Não mude as cores.
Não mude a camisa.
Não aumente nem diminua a camisa.
Não altere os elementos gráficos já existentes no template.
Não adicione novos elementos.

A camisa da IMAGEM 1 deve permanecer exatamente no mesmo lugar, com o mesmo tamanho e o mesmo recorte.

A pessoa da IMAGEM 2 deve ser encaixada dentro da camisa da IMAGEM 1, como se estivesse usando aquela camisa originalmente.

Ajuste apenas o corpo, pescoço, cabeça e rosto da pessoa para encaixar de forma natural na camisa.

Não deixar a cabeça pequena.
Não deixar a cabeça grande demais.
Não mostrar braços extras.
Não deformar o rosto.
Não mudar a identidade da pessoa.
Preservar rosto, cabelo, tom de pele, expressão e aparência natural da pessoa da IMAGEM 2.

O resultado precisa parecer uma figurinha realista, limpa e bem encaixada.

Substitua os textos atuais do template pelos novos dados:

Onde está o nome atual, substituir por:
${cardData.name}

Onde está a linha de dados atual, substituir por:
${cardData.birthDate} | ${height} | ${weight}

Onde está o time atual, substituir por:
${cardData.team || 'N/A'}

Manter a mesma fonte, mesma cor, mesmo tamanho, mesmo alinhamento e mesmo estilo dos textos do template original.

Dados novos:
Nome: ${cardData.name}
Data de nascimento: ${cardData.birthDate}
Altura: ${height}
Peso: ${weight}
Cidade/UF: ${cityUf}
Time: ${cardData.team || 'N/A'}
`;

  if (cardData.country) {
    prompt += `Seleção/País: ${cardData.country}\n`;
  }
  if (cardData.position) {
    prompt += `Posição/Estilo: ${cardData.position}\n`;
  }

  prompt += `\nResultado final:
uma figurinha vertical, realista, organizada, com a pessoa da IMAGEM 2 perfeitamente encaixada no template da IMAGEM 1.`;

  return prompt;
};
