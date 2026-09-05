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
    fullLegalName: string;
    payoutMethod: string;
    payoutAccount: string;
    proofOfPayment: string;
}
export declare function toProfilePayload(form: ProfileForm): {
    email: string;
    phone: string;
    country: string;
    bio: string;
    skills: string[];
    payout_method_added: boolean;
    profile_picture: string | null;
    id_type: string | null;
    id_number: string | null;
    date_of_birth: string | null;
    address: string | null;
    full_legal_name: string | null;
    payout_method: string | null;
    payout_account: string | null;
    proof_of_payment: string | null;
};
//# sourceMappingURL=profilePayload.d.ts.map