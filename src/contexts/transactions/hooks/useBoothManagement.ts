import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { Booth, BoothRequest } from "@/types";
import { uniqueToast } from "@/utils/toastHelpers";
import { firestore } from "@/integrations/firebase/client";
import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    doc,
    getDoc,
    orderBy,
    serverTimestamp,
    deleteDoc,
    updateDoc,
    arrayUnion,
} from "firebase/firestore";
import { deleteBooth as deleteBoothService } from "@/contexts/transactions/boothService";
import { backend } from "@/utils/backend";

export interface UseBoothManagementReturn {
    booths: Booth[];
    getBoothById: (id: string) => Booth | undefined;
    loadBooths: () => Promise<Booth[]>;
    loadBoothRequests: () => Promise<BoothRequest[]>;
    loadStudentBooths: (userId?: string) => Promise<Booth[]>;
    getBoothsByUserId: (userId: string) => Booth[];
    fetchAllBooths: () => Promise<Booth[]>;
    fetchAllBoothRequests: () => Promise<BoothRequest[]>;
    createBooth: (
        name: string,
        description: string,
        managerId: string,
        pin: string,
    ) => Promise<string | null>;
    deleteBooth: (boothId: string) => Promise<boolean>;
    joinBooth: (pin: string, userId: string) => Promise<boolean>;
    isLoading: boolean;
}

export const useBoothManagement = (): UseBoothManagementReturn => {
    const { user, isAuthenticated, updateUserData } = useAuth();
    const [booths, setBooths] = useState<Booth[]>([]);
    const [boothRequests, setBoothRequests] = useState<BoothRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load all initiatives
    const loadBooths = useCallback(async () => {
        // console.log('Loading all initiatives');
        setIsLoading(true);

        try {
            const boothsCollection = collection(firestore, "booths");
            const boothsQuery = query(
                boothsCollection,
                orderBy("created_at", "desc"),
            );
            const boothsSnapshot = await getDocs(boothsQuery);

            const boothsData: Booth[] = [];

            for (const boothDoc of boothsSnapshot.docs) {
                const boothData = boothDoc.data();

                // Check if the initiative already has products in the document
                const products = boothData.products || [];

                // Map the products to our Product type
                const mappedProducts = products.map((prod: any) => ({
                    id: prod.id,
                    name: prod.name,
                    price: prod.price,
                    boothId: boothDoc.id,
                    description: prod.description || "",
                    image: prod.image || "",
                    salesCount: prod.salesCount || 0,
                }));

                boothsData.push({
                    id: boothDoc.id,
                    name: boothData.name,
                    description: boothData.description || "",
                    pin: boothData.pin,
                    products: mappedProducts,
                    managers: boothData.members || [],
                    totalEarnings: (boothData.sales || 0) / 100, // Convert from cents to dollars
                    createdAt: boothData.created_at,
                });
            }

            //   console.log('Loaded initiatives:', boothsData.length);
            return boothsData;
        } catch (error) {
            console.error("Error loading initiatives:", error);
            uniqueToast.error("Failed to load initiatives");
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadBoothRequests = useCallback(async () => {
        try {
            const boothRequestsCollection = collection(
                firestore,
                "booth_requests",
            );
            const boothRequestsQuery = query(boothRequestsCollection);
            const boothRequestsSnapshot = await getDocs(boothRequestsQuery);

            const boothRequestsData: BoothRequest[] = [];

            for (const boothRequestDoc of boothRequestsSnapshot.docs) {
                const boothRequestData = boothRequestDoc.data();

                boothRequestsData.push({
                    id: boothRequestDoc.id,
                    teachers: boothRequestData.teachers,
                    products: boothRequestData.products,
                    boothName: boothRequestData.boothName,
                    boothDescription: boothRequestData.boothDescription || "",
                    groupType: boothRequestData.groupType,
                    groupInfo: boothRequestData.groupInfo,
                    sellingDates: boothRequestData.sellingDates,
                    status: boothRequestData.status,
                    additionalInformation:
                        boothRequestData.additionalInformation,
                });
            }

            return boothRequestsData;
        } catch (error) {
            return [];
        }
    }, []);

    // Load initiatives where a user is a member
    const loadStudentBooths = useCallback(
        async (userId?: string) => {
            const userIdToUse = userId || (user ? user.id : undefined);

            if (!userIdToUse) {
                console.warn("No user ID provided for loadStudentBooths");
                return [];
            }

            console.log("Loading initiatives for user:", userIdToUse);
            setIsLoading(true);

            try {
                const boothsCollection = collection(firestore, "booths");
                const boothsQuery = query(
                    boothsCollection,
                    where("members", "array-contains", userIdToUse),
                    orderBy("created_at", "desc"),
                );
                const boothsSnapshot = await getDocs(boothsQuery);

                const boothsData: Booth[] = [];

                for (const boothDoc of boothsSnapshot.docs) {
                    const boothData = boothDoc.data();

                    // Load initiative products
                    const productsCollection = collection(
                        firestore,
                        "products",
                    );
                    const productsQuery = query(
                        productsCollection,
                        where("booth_id", "==", boothDoc.id),
                    );
                    const productsSnapshot = await getDocs(productsQuery);

                    const products = productsSnapshot.docs.map((productDoc) => {
                        const productData = productDoc.data();
                        return {
                            id: productDoc.id,
                            name: productData.name,
                            price: (productData.price || 0) / 100, // Convert from cents to dollars
                            boothId: boothDoc.id,
                            image: productData.image,
                            salesCount: 0,
                        };
                    });

                    boothsData.push({
                        id: boothDoc.id,
                        name: boothData.name,
                        description: boothData.description || "",
                        pin: boothData.pin,
                        products: products,
                        managers: boothData.members || [],
                        totalEarnings: (boothData.sales || 0) / 100, // Convert from cents to dollars
                        createdAt: boothData.created_at,
                    });
                }

                console.log("Loaded user initiatives:", boothsData.length);
                return boothsData;
            } catch (error) {
                console.error("Error loading user initiatives:", error);
                uniqueToast.error("Failed to load your initiatives");
                return [];
            } finally {
                setIsLoading(false);
            }
        },
        [user],
    );

    // Function to join an initiative using PIN
    const joinBooth = async (pin: string, userId: string): Promise<boolean> => {
        console.log("Attempting to join initiative with PIN:", pin);
        setIsLoading(true);

        try {
            const result = await backend.joinBooth(pin);
            const boothId = result.boothId;

            if (user && user.id === userId) {
                const currentBooths = user.booths || [];
                if (!currentBooths.includes(boothId)) {
                    updateUserData({
                        ...user,
                        booths: [...currentBooths, boothId],
                    });
                }
            }

            // Refresh the initiatives list after joining
            const updatedBooths = await loadBooths();
            setBooths(updatedBooths);

            return true;
        } catch (error) {
            console.error("Error joining initiative:", error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch all initiatives and update state
    const fetchAllBooths = useCallback(async () => {
        setIsLoading(true);
        try {
            const boothsData = await loadBooths();
            setBooths(boothsData);
            return boothsData; // Return the initiatives data to match the interface
        } catch (error) {
            console.error("Error in fetchAllBooths:", error);
            return []; // Return empty array on error to match the interface
        } finally {
            setIsLoading(false);
        }
    }, [loadBooths]);

    // Effect to load initiatives when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchAllBooths();
        }
    }, [isAuthenticated, fetchAllBooths]);

    const fetchAllBoothRequests = useCallback(async () => {
        try {
            const boothRequestsData = await loadBoothRequests();
            setBoothRequests(boothRequestsData);
            return boothRequestsData;
        } catch (error) {
            console.error("Error in fetchAllBoothRequests:", error);
            return [];
        }
    }, [loadBoothRequests]);

    // Create a new initiative
    const createBooth = async (
        name: string,
        description: string,
        managerId: string,
        pin: string,
    ): Promise<string | null> => {
        console.log("Creating initiative:", {
            name,
            description,
            managerId,
            pin,
        });
        setIsLoading(true);

        try {
            // Create the initiative
            const boothData = {
                name,
                description,
                members: [managerId], // Initial member - not just manager but member
                pin,
                sales: 0,
                created_at: new Date().toISOString(),
                created_by: managerId,
            };

            const result = await backend.createBooth(name, description, managerId, pin);

            // Update initiative list
            await fetchAllBooths();

            console.log("Initiative created with ID:", result.boothId);
            uniqueToast.success("Initiative created successfully");

            return result.boothId;
        } catch (error) {
            console.error("Error creating initiative:", error);
            uniqueToast.error(
                "Failed to create initiative: " +
                    (error instanceof Error ? error.message : "Unknown error"),
            );
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Delete an initiative
    const deleteBooth = async (boothId: string): Promise<boolean> => {
        setIsLoading(true);

        try {
            const success = await deleteBoothService(boothId);

            if (success) {
                // Update the local initiatives state by removing the deleted initiative
                setBooths((prevBooths) =>
                    prevBooths.filter((booth) => booth.id !== boothId),
                );
                uniqueToast.success("Initiative deleted successfully");
            }

            return success;
        } catch (error) {
            console.error("Error deleting initiative:", error);
            uniqueToast.error("Failed to delete initiative");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Get initiative by ID
    const getBoothById = useCallback(
        (id: string): Booth | undefined => {
            return booths.find((booth) => booth.id === id);
        },
        [booths],
    );

    // Get initiatives by user ID
    const getBoothsByUserId = useCallback(
        (userId: string): Booth[] => {
            return booths.filter((booth) => booth.managers.includes(userId));
        },
        [booths],
    );

    return {
        booths,
        getBoothById,
        loadBooths,
        loadBoothRequests,
        loadStudentBooths,
        getBoothsByUserId,
        fetchAllBooths,
        fetchAllBoothRequests,
        createBooth,
        deleteBooth,
        joinBooth,
        isLoading,
    };
};
