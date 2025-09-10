import { useState } from 'react';

export interface ManualCreateState {
  showManualCreate: boolean;
  setShowManualCreate: React.Dispatch<React.SetStateAction<boolean>>;
  manualUseDetails: boolean;
  setManualUseDetails: React.Dispatch<React.SetStateAction<boolean>>;
  manualJobId: string; setManualJobId: (v: string) => void;
  manualUrl: string; setManualUrl: (v: string) => void;
  manualSubmitted: boolean; setManualSubmitted: (v: boolean) => void;
  manualJobTitle: string; setManualJobTitle: (v: string) => void;
  manualJobCompany: string; setManualJobCompany: (v: string) => void;
  manualJobLocation: string; setManualJobLocation: (v: string) => void;
  manualJobType: string; setManualJobType: (v: string) => void;
  manualJobUrl: string; setManualJobUrl: (v: string) => void;
  manualMinSalary: string; setManualMinSalary: (v: string) => void;
  manualMaxSalary: string; setManualMaxSalary: (v: string) => void;
  manualDatePosted: string; setManualDatePosted: (v: string) => void;
  manualDescription: string; setManualDescription: (v: string) => void;
  creating: boolean; setCreating: (v: boolean) => void;
  reset: () => void;
}

export function useManualCreateForm(): ManualCreateState {
  const [showManualCreate, setShowManualCreate] = useState(false);
  const [manualUseDetails, setManualUseDetails] = useState(false);
  const [manualJobId, setManualJobId] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [manualSubmitted, setManualSubmitted] = useState(false);
  const [manualJobTitle, setManualJobTitle] = useState("");
  const [manualJobCompany, setManualJobCompany] = useState("");
  const [manualJobLocation, setManualJobLocation] = useState("");
  const [manualJobType, setManualJobType] = useState("");
  const [manualJobUrl, setManualJobUrl] = useState("");
  const [manualMinSalary, setManualMinSalary] = useState("");
  const [manualMaxSalary, setManualMaxSalary] = useState("");
  const [manualDatePosted, setManualDatePosted] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [creating, setCreating] = useState(false);

  function reset() {
    setManualUseDetails(false);
    setManualJobId("");
    setManualUrl("");
    setManualSubmitted(false);
    setManualJobTitle("");
    setManualJobCompany("");
    setManualJobLocation("");
    setManualJobType("");
  setManualJobUrl("");
    setManualMinSalary("");
    setManualMaxSalary("");
    setManualDatePosted("");
    setManualDescription("");
  }

  return {
    showManualCreate, setShowManualCreate,
    manualUseDetails, setManualUseDetails,
    manualJobId, setManualJobId,
    manualUrl, setManualUrl,
    manualSubmitted, setManualSubmitted,
    manualJobTitle, setManualJobTitle,
    manualJobCompany, setManualJobCompany,
    manualJobLocation, setManualJobLocation,
    manualJobType, setManualJobType,
  manualJobUrl, setManualJobUrl,
    manualMinSalary, setManualMinSalary,
    manualMaxSalary, setManualMaxSalary,
    manualDatePosted, setManualDatePosted,
    manualDescription, setManualDescription,
    creating, setCreating,
    reset,
  };
}