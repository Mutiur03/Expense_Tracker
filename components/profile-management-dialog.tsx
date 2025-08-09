"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "../hooks/use-toast";
import type { ProfileConfig } from "../lib/types";
import { DEFAULT_CURRENCY } from "@/lib/currency";

type ProfileFormData = {
    name: string;
    currency: string;
    description: string;
    color: string;
};

interface ProfileManagementDialogProps {
    children: React.ReactNode;
    onSave: (profileData: Omit<ProfileConfig, "id" | "createdAt">) => void;
    editProfile?: ProfileConfig;
    mode?: "add" | "edit";
}

const defaultColors = [
    "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
    "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1"
];

export function ProfileManagementDialog({
    children,
    onSave,
    editProfile,
    mode = "add"
}: ProfileManagementDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<ProfileFormData>({
        defaultValues: {
            name: "",
            description: "",
            currency: DEFAULT_CURRENCY.code,
            color: defaultColors[0],
        },
    });

    // Reset form when dialog opens or editProfile changes
    useEffect(() => {
        if (open) {
            form.reset({
                name: editProfile?.name || "",
                description: editProfile?.description || "",
                currency: editProfile?.currency || DEFAULT_CURRENCY.code,
                color: editProfile?.color || defaultColors[0],
            });
        }
    }, [open, editProfile, form]);

    const onSubmit = (data: ProfileFormData) => {
        if (!data.name.trim()) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Profile name is required.",
            });
            return;
        }

        onSave(data);
        toast({
            title: mode === "add" ? "Profile Created" : "Profile Updated",
            description: `${data.name} has been ${mode === "add" ? "created" : "updated"} successfully.`,
        });

        // Reset form for add mode
        if (mode === "add") {
            form.reset({
                name: "",
                description: "",
                color: defaultColors[0],
            });
        }
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "add" ? "Create New Profile" : "Edit Profile"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "add"
                            ? "Create a new expense profile to organize your transactions."
                            : "Update the profile details."
                        }
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Profile Name</Label>
                        <Input
                            id="name"
                            {...form.register("name", { required: true })}
                            placeholder="e.g. Personal, Business, Travel"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            {...form.register("description")}
                            placeholder="Brief description of this profile..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {defaultColors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.watch("color") === color
                                        ? "border-primary scale-110"
                                        : "border-border hover:scale-105"
                                        }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => form.setValue("color", color)}
                                />
                            ))}
                        </div>
                        <Input
                            type="color"
                            {...form.register("color")}
                            className="w-20 h-10"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {mode === "add" ? "Create Profile" : "Update Profile"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
