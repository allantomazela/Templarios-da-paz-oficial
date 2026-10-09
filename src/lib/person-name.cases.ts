/**
 * Casos de referência da formatação de nomes, usados tanto no teste de formatPersonName
 * quanto no teste que chama public.format_person_name no banco (person-name.db.test.ts).
 * Um caso novo aqui passa a valer para os dois lados.
 */
export interface PersonNameCase {
  input: string
  expected: string
}

export const PERSON_NAME_CASES: readonly PersonNameCase[] = [
  { input: 'ALLAN TOMAZELA DE CAMARGO', expected: 'Allan Tomazela de Camargo' },
  { input: 'OSWALDO MELO DA ROCHA', expected: 'Oswaldo Melo da Rocha' },
  { input: 'JOAO DOS SANTOS E SILVA', expected: 'Joao dos Santos e Silva' },
  { input: 'MARIA DAS DORES DO CARMO', expected: 'Maria das Dores do Carmo' },
  { input: 'DE OLIVEIRA DAS NEVES', expected: 'De Oliveira das Neves' },
  { input: 'E SILVA', expected: 'E Silva' },
  { input: '  ALLAN   TOMAZELA\u00A0DE  CAMARGO ', expected: 'Allan Tomazela de Camargo' },
  { input: "JOSÉ D'ÁVILA ANA-MARIA ÇÉLIO", expected: "José D'Ávila Ana-Maria Çélio" },
  { input: 'Osses de Toledo é Silva', expected: 'Osses de Toledo e Silva' },
  { input: 'jose guerxis De Aguiar', expected: 'Jose Guerxis de Aguiar' },
  { input: 'RICARDO DEL NERO DI GIORGIO', expected: 'Ricardo Del Nero Di Giorgio' },
  { input: 'ÁLVARO ÚRSULA ÍTALO ÔNIX', expected: 'Álvaro Úrsula Ítalo Ônix' },
  { input: 'Sandro Maschetti', expected: 'Sandro Maschetti' },
  { input: '   ', expected: '' },
]
