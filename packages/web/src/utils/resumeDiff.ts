import { ResumeData } from "@/components/application/types";

export type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged';

export interface DiffItem<T> {
  status: DiffStatus;
  data: T;
  oldData?: T;
}

export interface ResumeDiff {
  personalInfo: {
    fullName: DiffItem<string>;
    email: DiffItem<string>;
    phone: DiffItem<string>;
    location: DiffItem<string>;
    summary: DiffItem<string>;
  };
  experience: DiffItem<any>[];
  education: DiffItem<any>[];
  skills: DiffItem<any>[];
  projects: DiffItem<any>[];
}

export function compareResumes(oldResume: ResumeData, newResume: ResumeData): ResumeDiff {
  const compareStrings = (oldStr: string = "", newStr: string = ""): DiffItem<string> => {
    if (oldStr === newStr) return { status: 'unchanged', data: newResume.personalInfo.fullName }; // data is just a placeholder here
    if (!oldStr && newStr) return { status: 'added', data: newStr };
    if (oldStr && !newStr) return { status: 'removed', data: oldStr };
    return { status: 'modified', data: newStr, oldData: oldStr };
  };

  const getDiffItem = (oldVal: string | undefined, newVal: string | undefined): DiffItem<string> => {
    const o = oldVal || "";
    const n = newVal || "";
    if (o === n) return { status: 'unchanged', data: n };
    if (!o && n) return { status: 'added', data: n };
    if (o && !n) return { status: 'removed', data: o };
    return { status: 'modified', data: n, oldData: o };
  };

  // Helper to diff arrays of objects by ID or content
  function diffArray<T>(
    oldArr: T[] = [], 
    newArr: T[] = [], 
    identityFn: (item: T) => string
  ): DiffItem<T>[] {
    const diffs: DiffItem<T>[] = [];
    const oldMap = new Map(oldArr.map(item => [identityFn(item), item]));
    const newMap = new Map(newArr.map(item => [identityFn(item), item]));

    // Check for added or modified
    newArr.forEach(item => {
      const id = identityFn(item);
      const oldItem = oldMap.get(id);
      if (!oldItem) {
        diffs.push({ status: 'added', data: item });
      } else if (JSON.stringify(oldItem) !== JSON.stringify(item)) {
        diffs.push({ status: 'modified', data: item, oldData: oldItem });
      } else {
        diffs.push({ status: 'unchanged', data: item });
      }
    });

    // Check for removed
    oldArr.forEach(item => {
      const id = identityFn(item);
      if (!newMap.has(id)) {
        diffs.push({ status: 'removed', data: item });
      }
    });

    return diffs;
  }

  return {
    personalInfo: {
      fullName: getDiffItem(oldResume.personalInfo.fullName, newResume.personalInfo.fullName),
      email: getDiffItem(oldResume.personalInfo.email, newResume.personalInfo.email),
      phone: getDiffItem(oldResume.personalInfo.phone, newResume.personalInfo.phone),
      location: getDiffItem(oldResume.personalInfo.location, newResume.personalInfo.location),
      summary: getDiffItem(oldResume.personalInfo.summary, newResume.personalInfo.summary),
    },
    experience: diffArray(
      oldResume.experience, 
      newResume.experience, 
      i => i.id || `${i.company}-${i.position}`
    ),
    education: diffArray(
      oldResume.education, 
      newResume.education, 
      i => i.id || `${i.institution}-${i.degree}`
    ),
    skills: diffArray(
      oldResume.skills, 
      newResume.skills, 
      i => i.category
    ),
    projects: diffArray(
      oldResume.projects, 
      newResume.projects, 
      i => i.id || i.name
    )
  };
}
