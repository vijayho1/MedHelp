export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  history: string;
  symptoms: string;
  tests: string;
  allergies: string;
  possibleCondition?: string;
  recommendations?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIExtraction {
  age?: number;
  history?: string;
  symptoms?: string;
  tests?: string;
  allergies?: string;
  possibleCondition?: string;
  recommendations?: string;
}
