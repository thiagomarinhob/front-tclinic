export interface ExamCategory {
  label: string;
  exams: string[];
}

export const EXAM_CATALOG: ExamCategory[] = [
  {
    label: 'Exames de Imagem',
    exams: [
      'Densidade Óssea',
      'Ecocardiograma',
      'Eletrocardiograma',
      'Mamografia',
      'Papanicolau',
      'Raio-X',
      'Teste Ergométrico',
      'Tomografia',
      'Ultrassonografia - Abdome',
      'Ultrassonografia - Pélvica',
      'Ultrassonografia - Tireoide',
    ],
  },
  {
    label: 'Exames Laboratoriais',
    exams: [
      'Ácido Úrico',
      'Exames de Fezes',
      'Exames de Urina',
      'Função Hepática',
      'Função Renal',
      'Função Tireoidiana',
      'Glicemia de Jejum',
      'Hemoglobina Glicada',
      'Hemograma Completo',
      'Perfil Lipídico',
      'Sorologias / Infecções',
    ],
  },
  {
    label: 'Laudo Psiquiátrico',
    exams: ['Laudo Psiquiátrico'],
  },
  {
    label: 'Exames Admissionais',
    exams: [
      'ALT',
      'AST',
      'Creatinina',
      'EAS',
      'Gama-GT',
      'Perfil Lipídico',
    ],
  },
];
