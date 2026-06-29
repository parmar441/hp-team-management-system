import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePerson, type Person } from "../../hooks/usePeople";
import { ScreenHeader, Label, TextInput, ChipGroup, PrimaryButton, useToast } from "../ui";

const EMPTY: Partial<Person> = {
  firstName: "", lastName: "", email: "", phone: "", familyId: "", city: "", state: "",
  country: "USA", gender: "M", ageRange: "15-45", acoNeeded: "No", mandal: "",
};

export default function MRegistration() {
  const toast = useToast();
  const navigate = useNavigate();
  const createPerson = useCreatePerson();
  const [form, setForm] = useState<Partial<Person>>(EMPTY);

  const set = (k: keyof Person, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const input = (k: keyof Person) => ({
    value: (form[k] as string) || "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value),
  });

  function submit() {
    if (!form.firstName?.trim()) { toast("First name is required"); return; }
    createPerson.mutate(form, {
      onSuccess: () => { toast("Person registered"); setForm(EMPTY); navigate("/people"); },
      onError: () => toast("Failed to register"),
    });
  }

  return (
    <div className="pt-2 pb-4">
      <ScreenHeader title="Register" subtitle="Add a new member to the system" />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>First name *</Label><TextInput placeholder="First name" {...input("firstName")} /></div>
          <div><Label>Last name</Label><TextInput placeholder="Last name" {...input("lastName")} /></div>
        </div>
        <div><Label>Email</Label><TextInput type="email" placeholder="email@example.com" {...input("email")} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Phone</Label><TextInput placeholder="+1 555…" {...input("phone")} /></div>
          <div><Label>Family ID</Label><TextInput placeholder="Optional" {...input("familyId")} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>City</Label><TextInput placeholder="City" {...input("city")} /></div>
          <div><Label>State (mandal)</Label><TextInput placeholder="New Jersey" value={form.mandal || ""}
            onChange={(e) => setForm((f) => ({ ...f, mandal: e.target.value, state: e.target.value }))} /></div>
        </div>

        <div><Label>Country</Label>
          <ChipGroup value={(form.country as string) || ""} onChange={(v) => set("country", v)}
            options={[{ value: "USA", label: "USA" }, { value: "Canada", label: "Canada" }, { value: "Other", label: "Other" }]} />
        </div>
        <div><Label>Gender</Label>
          <ChipGroup value={form.gender || ""} onChange={(v) => set("gender", v)}
            options={[{ value: "M", label: "Male" }, { value: "F", label: "Female" }]} />
        </div>
        <div><Label>Age range</Label>
          <ChipGroup value={form.ageRange || ""} onChange={(v) => set("ageRange", v)}
            options={["0-6", "7-14", "15-45", "46-65", "65+"].map((r) => ({ value: r, label: r }))} />
        </div>
        <div><Label>ACO participation</Label>
          <ChipGroup value={form.acoNeeded || ""} onChange={(v) => set("acoNeeded", v)}
            options={[{ value: "Yes", label: "ACO player" }, { value: "No", label: "Non-ACO" }]} />
        </div>

        <div className="pt-2">
          <PrimaryButton onClick={submit} disabled={createPerson.isPending}>
            {createPerson.isPending ? "Registering…" : "Register person"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
