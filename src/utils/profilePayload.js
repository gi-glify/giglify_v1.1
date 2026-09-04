export function toProfilePayload(form) {
    return {
        phone: form.phone,
        country: form.country,
        bio: form.bio,
        skills: form.skills,
        payout_method_added: form.payoutMethodAdded,
        profile_picture: form.profilePicture || null,
        id_type: form.idType || null,
        id_number: form.idNumber || null,
        date_of_birth: form.dateOfBirth || null,
        address: form.address || null,
        full_legal_name: form.fullLegalName || null,
        payout_method: form.payoutMethod || null,
        payout_account: form.payoutAccount || null,
        proof_of_payment: form.proofOfPayment || null,
    };
}
//# sourceMappingURL=profilePayload.js.map