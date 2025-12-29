export interface Project {
  id: string;
  name: string;
  owner: string;
  contractor: string;
  technologyProvider?: string;
  contractType: string;
  termOfPayment: string;
  contractPrice: number;
  bac: number;
  ldDelay: number;
  ldPerformance: number;
  scopeByOwner?: string;
  startDate: string;
  finishDate: string;
  guaranteedPower: number;
  ntpDate?: string;
  codDate?: string;
  status: 'Active' | 'Completed' | 'On Hold';
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectFormData extends Partial<Project> {}
