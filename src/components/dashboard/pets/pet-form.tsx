"use client";

import * as React from "react";
import dogBreeds from "dog-breeds/dog-breeds.json";
import { Loader2, Calendar, Sparkles, HelpCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { PetFormInput } from "@/services/pets";

const speciesOptions = ["dog", "cat", "bird", "rabbit", "reptile", "other"] as const;
const sexOptions = ["male", "female", "unknown"] as const;

const breedSuggestions: Record<PetFormInput["species"], string[]> = {
  dog: dogBreeds.map((breed) => breed.name),
  cat: ["Puspin", "Persian", "Siamese", "British Shorthair", "Maine Coon", "Ragdoll", "Bengal", "Sphynx"],
  bird: ["Budgerigar", "Cockatiel", "Lovebird", "African Grey Parrot", "Canary", "Cockatoo"],
  rabbit: ["Holland Lop", "Lionhead", "Netherland Dwarf", "Mini Rex", "Flemish Giant"],
  reptile: ["Bearded Dragon", "Leopard Gecko", "Red-Eared Slider", "Ball Python", "Corn Snake", "Chameleon"],
  other: [],
};

export const emptyPetForm: PetFormInput = {
  name: "",
  species: "dog",
  speciesDetail: "",
  breed: "",
  sex: "unknown",
  dateOfBirth: "",
  age: "",
  color: "",
  notes: "",
};

function calculateAgeFromDob(dobStr: string): string {
  if (!dobStr) return "";
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return "";
  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    years--;
  }
  return Math.max(0, years).toString();
}

export function PetForm({
  initialValue = emptyPetForm,
  title,
  description,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initialValue?: PetFormInput;
  title: string;
  description: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (value: PetFormInput) => Promise<void>;
}) {
  const [value, setValue] = React.useState(initialValue);
  const [isAgeUnknown, setIsAgeUnknown] = React.useState(
    initialValue.age === "" && !initialValue.dateOfBirth
  );
  const [error, setError] = React.useState<string | null>(null);
  const [showBreedResults, setShowBreedResults] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const matchingBreeds = (breedSuggestions[value.species] || [])
    .filter((breed) => breed.toLowerCase().includes(value.breed.trim().toLowerCase()))
    .slice(0, 12);

  const setField = <K extends keyof PetFormInput>(field: K, fieldValue: PetFormInput[K]) => {
    setValue((current) => ({ ...current, [field]: fieldValue }));
  };

  const handleDobChange = (dobStr: string) => {
    const calculatedAge = calculateAgeFromDob(dobStr);
    setValue((current) => ({
      ...current,
      dateOfBirth: dobStr,
      age: calculatedAge !== "" ? calculatedAge : current.age,
    }));
    if (dobStr) {
      setIsAgeUnknown(false);
    }
  };

  const handleAgeUnknownToggle = (checked: boolean) => {
    setIsAgeUnknown(checked);
    if (checked) {
      setValue((current) => ({ ...current, age: "" }));
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const payload: PetFormInput = {
          ...value,
          age: isAgeUnknown ? "" : value.age,
        };
        await onSubmit(payload);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "We could not save this pet.");
      }
    });
  };

  return (
    <form className="w-full" onSubmit={submit}>
      <Card className="w-full shadow-xs border-border">
        <CardHeader className="space-y-1.5 pb-6">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Pet Name */}
            <label className="grid min-w-0 gap-1.5 text-sm font-medium text-foreground">
              <span>
                Pet name <span className="text-destructive">*</span>
              </span>
              <input
                value={value.name}
                onChange={(event) => setField("name", event.target.value)}
                placeholder="e.g. Milo, Bella, Luna"
                required
                className="min-h-12 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>

            {/* Species */}
            <label className="grid min-w-0 gap-1.5 text-sm font-medium text-foreground">
              <span>
                Species <span className="text-destructive">*</span>
              </span>
              <select
                value={value.species}
                onChange={(event) => setField("species", event.target.value as PetFormInput["species"])}
                className="min-h-12 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground capitalize outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring"
              >
                {speciesOptions.map((species) => (
                  <option key={species} value={species}>
                    {species === "other" ? "Other (specify below)" : species}
                  </option>
                ))}
              </select>
            </label>

            {/* Species Detail (if 'other') */}
            {value.species === "other" && (
              <label className="grid min-w-0 gap-1.5 text-sm font-medium text-foreground md:col-span-2">
                <span>
                  Please specify the species <span className="text-destructive">*</span>
                </span>
                <input
                  value={value.speciesDetail}
                  onChange={(event) => setField("speciesDetail", event.target.value)}
                  placeholder="e.g. Hamster, Ferret, Hedgehog"
                  required
                  className="min-h-12 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            )}

            {/* Breed */}
            <label className="grid min-w-0 gap-1.5 text-sm font-medium text-foreground">
              <span>Breed</span>
              <span className="relative">
                <input
                  value={value.breed}
                  onFocus={() => setShowBreedResults(true)}
                  onChange={(event) => {
                    setField("breed", event.target.value);
                    setShowBreedResults(true);
                  }}
                  onBlur={() => window.setTimeout(() => setShowBreedResults(false), 180)}
                  placeholder="e.g. Golden Retriever, Puspin, Mixed"
                  role="combobox"
                  aria-expanded={showBreedResults}
                  aria-controls="breed-results"
                  aria-autocomplete="list"
                  className="min-h-12 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
                {showBreedResults && matchingBreeds.length > 0 && (
                  <ul
                    id="breed-results"
                    role="listbox"
                    className="absolute left-0 top-full z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg"
                  >
                    {matchingBreeds.map((breed) => (
                      <li key={breed} role="option" aria-selected={value.breed === breed}>
                        <Button
                          type="button"
                          variant="ghost"
                          className="min-h-10 w-full justify-start rounded-lg border-0 bg-transparent px-3 text-left text-xs shadow-none hover:bg-muted"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setField("breed", breed);
                            setShowBreedResults(false);
                          }}
                        >
                          {breed}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {value.species === "dog"
                  ? "Search popular breeds or enter a custom breed."
                  : "Type to search suggestions or enter custom breed."}
              </span>
            </label>

            {/* Sex */}
            <label className="grid min-w-0 gap-1.5 text-sm font-medium text-foreground">
              <span>Sex</span>
              <select
                value={value.sex}
                onChange={(event) => setField("sex", event.target.value as PetFormInput["sex"])}
                className="min-h-12 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground capitalize outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring"
              >
                {sexOptions.map((sex) => (
                  <option key={sex} value={sex} className="capitalize">
                    {sex}
                  </option>
                ))}
              </select>
            </label>

            {/* Colour / Markings */}
            <label className="grid min-w-0 gap-1.5 text-sm font-medium text-foreground">
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Colour / Markings
              </span>
              <input
                value={value.color}
                onChange={(event) => setField("color", event.target.value)}
                placeholder="e.g. Golden, Black & White, Tricolor, Brown"
                className="min-h-12 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-xs font-normal text-muted-foreground">
                Coat color, patterns, or distinctive markings.
              </span>
            </label>

            {/* Date of birth */}
            <label className="grid min-w-0 gap-1.5 text-sm font-medium text-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                Date of birth (Optional)
              </span>
              <input
                type="date"
                value={value.dateOfBirth}
                onChange={(event) => handleDobChange(event.target.value)}
                className="min-h-12 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-xs font-normal text-muted-foreground">
                Selecting a birth date will automatically calculate the age.
              </span>
            </label>

            {/* Age */}
            <div className="grid min-w-0 gap-1.5 text-sm font-medium text-foreground">
              <div className="flex items-center justify-between">
                <span>Age (years)</span>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAgeUnknown}
                    onChange={(e) => handleAgeUnknownToggle(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-input accent-primary"
                  />
                  <span>Age unknown</span>
                </label>
              </div>
              <input
                type="number"
                min="0"
                step="1"
                disabled={isAgeUnknown}
                value={isAgeUnknown ? "" : value.age}
                onChange={(event) => {
                  setField("age", event.target.value);
                  if (event.target.value !== "") {
                    setIsAgeUnknown(false);
                  }
                }}
                placeholder={isAgeUnknown ? "Unknown" : "e.g. 2"}
                className={`min-h-12 rounded-xl border border-input px-3.5 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring ${
                  isAgeUnknown
                    ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                    : "bg-background text-foreground"
                }`}
              />
              <span className="text-xs font-normal text-muted-foreground">
                {isAgeUnknown
                  ? "Marked as unknown. Uncheck to specify years."
                  : "Approximate or exact age in whole years."}
              </span>
            </div>

            {/* Notes */}
            <label className="grid min-w-0 gap-1.5 text-sm font-medium text-foreground md:col-span-2">
              <span>Medical & General Notes</span>
              <textarea
                value={value.notes}
                onChange={(event) => setField("notes", event.target.value)}
                placeholder="Allergies, chronic conditions, behavioral notes, microchip number, or special care instructions…"
                rows={4}
                className="min-h-28 rounded-xl border border-input bg-background px-3.5 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto min-h-11 rounded-xl font-medium"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto min-h-11 rounded-xl font-semibold gap-2"
            disabled={isPending}
          >
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {submitLabel}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
