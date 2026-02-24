export const conditions = [
  {
    id: 'normal',
    label: 'Normal ENT anatomy overview',
    structures: [],
    explanation:
      'This view shows a simplified ear, nasal septum, and vocal fold region. Select a condition to highlight the affected structure and display a patient-friendly explanation.',
  },
  {
    id: 'tympanic-membrane-perforation',
    label: 'Tympanic membrane perforation',
    structures: ['tympanicMembrane'],
    explanation:
      'A tympanic membrane perforation means there is a hole in the eardrum. This can cause hearing changes, discomfort, or recurrent ear infections. Treatment depends on size, symptoms, and duration.',
  },
  {
    id: 'deviated-septum',
    label: 'Deviated septum',
    structures: ['nasalSeptum'],
    explanation:
      'A deviated septum occurs when the tissue dividing the nasal passages is displaced to one side. This can contribute to blocked airflow, snoring, or recurrent sinus symptoms.',
  },
  {
    id: 'vocal-cord-polyp',
    label: 'Vocal cord polyp',
    structures: ['vocalCord'],
    explanation:
      'A vocal cord polyp is a benign lesion on the vocal fold. It may cause hoarseness, voice fatigue, or pitch changes. Voice therapy and selected surgical treatment can improve symptoms.',
  },
];
