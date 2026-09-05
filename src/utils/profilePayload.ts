export interface ProfileForm {
  email: string;
  phone: string;
  country: string;
  bio: string;
  skills: string[];
  payoutMethodAdded: boolean;
  profilePicture: string;
  idType: string;
  idNumber: string;
  dateOfBirth: string;
  address: string;
  payoutMethod: string;
  payoutAccount: string;
  proofOfPayment: string;
}

function normalizeDate(value: string) {
  const trimmed = value.trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : trimmed || null;
}

export function toProfilePayload(form: ProfileForm) {
  return {
    email: form.email.trim(),
    phone: form.phone,
    country: form.country,
    bio: form.bio,
    skills: form.skills,
    payout_method_added: form.payoutMethodAdded,
    profile_picture: form.profilePicture || null,
    id_type: form.idType || null,
    id_number: form.idNumber || null,
    date_of_birth: normalizeDate(form.dateOfBirth),
    address: form.address || null,
    payout_method: form.payoutMethod || null,
    payout_account: form.payoutAccount || null,
    proof_of_payment: form.proofOfPayment || null,
  };
}
