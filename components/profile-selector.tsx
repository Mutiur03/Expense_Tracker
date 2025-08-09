"use client";

import { Check, ChevronsUpDown, Plus, Edit, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "./ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog";
import { useState } from "react";
import { ProfileManagementDialog } from "./profile-management-dialog";
import { useToast } from "../hooks/use-toast";
import type { ProfileConfig } from "../lib/types";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface ProfileSelectorProps {
    profiles: ProfileConfig[];
    currentProfile: string;
    onProfileChange: (profileId: string) => void;
    onAddProfile: (profileData: Omit<ProfileConfig, "id" | "createdAt">) => Promise<ProfileConfig>;
    onUpdateProfile: (profileId: string, updates: Partial<Omit<ProfileConfig, "id" | "createdAt">>) => void;
    onDeleteProfile: (profileId: string) => void;
}

export function ProfileSelector({
    profiles,
    currentProfile,
    onProfileChange,
    onAddProfile,
    onUpdateProfile,
    onDeleteProfile,
}: ProfileSelectorProps) {
    const [open, setOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
    const { toast } = useToast();

    const currentProfileData = profiles.find(p => p.id === currentProfile);

    const handleDeleteProfile = (profileId: string, event?: React.MouseEvent) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (profiles.length <= 1) {
            toast({
                variant: "destructive",
                title: "Cannot Delete",
                description: "You must have at least one profile.",
            });
            return;
        }

        setProfileToDelete(profileId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (profileToDelete) {
            try {
                onDeleteProfile(profileToDelete);
                toast({
                    title: "Profile Deleted",
                    description: "The profile has been deleted successfully.",
                    variant: "destructive",
                });
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to delete profile",
                });
            }
        }
        setDeleteDialogOpen(false);
        setProfileToDelete(null);
    };

    // const handleAddProfile = (profileData: Omit<ProfileConfig, "id" | "createdAt">) => {
    //     const newProfile = onAddProfile(profileData);
    //     setOpen(false);
    //     return newProfile;
    // };

    const handleUpdateProfile = (profileId: string, updates: Partial<Omit<ProfileConfig, "id" | "createdAt">>) => {
        onUpdateProfile(profileId, updates);
        setOpen(false);
    };

    const truncateText = (text: string, maxLength: number = 10) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        <div className="flex items-center gap-2">
                            {currentProfileData && (
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: currentProfileData.color }}
                                />
                            )}
                            <span className="truncate">
                                {currentProfileData?.name ? truncateText(currentProfileData.name) : "Select profile..."}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Search profiles..." />
                        <CommandList>
                            <CommandEmpty>No profiles found.</CommandEmpty>
                            <CommandGroup>
                                {profiles.map((profile) => (
                                    <div key={profile.id} className="relative">
                                        <CommandItem
                                            value={profile.name}
                                            onSelect={() => {
                                                onProfileChange(profile.id);
                                                setOpen(false);
                                            }}
                                            className="flex items-center gap-2 pr-16"
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: profile.color }}
                                            />
                                            <span className="flex-1 truncate">{profile.name}</span>
                                            <Check
                                                className={cn(
                                                    "h-4 w-4 flex-shrink-0",
                                                    currentProfile === profile.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                            <ProfileManagementDialog
                                                mode="edit"
                                                editProfile={profile}
                                                onSave={(data) => handleUpdateProfile(profile.id, data)}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 hover:bg-accent"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                            </ProfileManagementDialog>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={(e) => handleDeleteProfile(profile.id, e)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup>
                                <ProfileManagementDialog onSave={onAddProfile}>
                                    <div className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm flex items-center">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add New Profile
                                    </div>
                                </ProfileManagementDialog>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the profile
                            and all associated transactions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
