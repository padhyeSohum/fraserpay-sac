import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { loginWithGoogle } from "@/contexts/auth/authOperations";
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from "react-router-dom";
import { addDoc, collection } from "firebase/firestore";
import { firestore } from "@/integrations/firebase/client";
import { RequestBoothLocalDraft } from "@/components/RequestBoothLocalDraft";
import { removeStorageItem } from "@/utils/storage";
interface SectionProps {
    title: string,
    description: string,
    children: ReactNode
}
const Section = ({ title, description, children }: SectionProps) => {
    return (
        <div className="w-full rounded-lg bg-gray-100 border-[2px] border-gray-200 p-2 text-pretty">
            <div className="text-xl font-bold">{title}</div>
            <div className="text-slate-600 text-sm">{description}</div>
            <div className="w-full">
                {children}
            </div>
        </div>
    );
}

interface StringInputProps {
    label: string,
    type: string,
    placeholder: string,
    value: string,
    onChange: React.ChangeEventHandler<HTMLInputElement>,
    minChars?: number,
    maxChars?: number,
    required?: boolean,
}
const StringInput = ({ label, type, placeholder, value, onChange, minChars = 0, maxChars = -1, required }: StringInputProps) => {

    return (
        <div className="flex flex-col place-items-start gap-y-2 my-4 mx-2">
            <div className="text-gray-600 font-bold text-sm">{label}</div>
            <input 
                type={type} 
                placeholder={placeholder} 
                value={value} 
                onChange={onChange} 
                className="p-2 text-sm rounded-lg border-2 border-gray-200 outline-none placeholder-gray-400 focus:bg-gray-200 hover:border-gray-400 focus:border-gray-400 transition-all duration-200"
            />
            <div className="text-sm text-red-500">
                {
                    maxChars !== -1 && value.length > maxChars 
                    ?
                    `Character count must not exceed ${maxChars}` 
                    : ""
                }
                {
                    required && value.length == 0 ? "This information is required." : value.length < minChars ? `Character count must be at least ${minChars}` : ""
                }
            </div>
        </div>
    )
}

interface NumberInputProps {
    label: string,
    placeholder: string,
    value: number,
    onChange: React.ChangeEventHandler<HTMLInputElement>,
}
const NumberInput = ({ label, placeholder, value, onChange }: NumberInputProps) => {
    return (
        <div className="flex flex-col place-items-start gap-y-2 my-4 mx-2">
            <div className="text-gray-600 font-bold text-sm">{label}</div>
            <input 
                type="number" 
                placeholder={placeholder} 
                value={value} 
                onChange={onChange} 
                className="p-2 text-sm rounded-lg border-2 border-gray-200 outline-none placeholder-gray-400 focus:bg-gray-200 hover:border-gray-400 focus:border-gray-400 transition-all duration-200"
            />
            <div className="text-sm text-red-500">
                {
                    value <= 0 ? "Please input a valid price." : ""
                }
            </div>
        </div>
    )
}

type TeacherDraft = { name: string; email: string };
type StudentDraft = { name: string; email: string; studentNumber: string };
type ProductDraft = { name: string; price: number; priceInput: string };
type RequestBoothDraft = {
    respondentName: string;
    respondentEmail: string;
    teachers: TeacherDraft[];
    students: StudentDraft[];
    boothName: string;
    boothDescription: string;
    organizationType: "None" | "Club/Council/Student Association" | "Class" | "Independent";
    organizationInfo: string;
    products: ProductDraft[];
};

const RequestBooth = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isSignedIn, setIsSignedIn] = useState(false);
    const [signedInTeacherEmail, setSignedInTeacherEmail] = useState<string>("");

    const [respondentName, setRespondentName] = useState("");
    const [respondentEmail, setRespondentEmail] = useState("");
    const [teachers, setTeachers] = useState([]);

    const [students, setStudents] = useState([{ name: "", email: "", studentNumber: "" }, { name: "", email: "", studentNumber: "" }, { name: "", email: "", studentNumber: "" }]);

    const [boothName, setBoothName] = useState("");
    const [boothDescription, setBoothDescription] = useState("");
    const [organizationType, setOrganizationType] = useState<"None" | "Club/Council/Student Association" | "Class" | "Independent">("None");
    const [organizationInfo, setOrganizationInfo] = useState("");
    const [products, setProducts] = useState([{ name: "", price: 0, priceInput: "" }]);

    const [isValid, setIsValid] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<"error" | "idle" | "submitting" | "success">("idle");

    const statusStyles = {
        idle: "from-purple-500 to-purple-700 hover:shadow-[0_0_35px_rgba(147,60,227,0.25)]",
        submitting: "from-purple-500 to-purple-700",
        success: "from-green-300 to-green-600 hover:shadow-[0_0_35px_rgba(78,200,123,0.25)]",
        error: "from-red-300 to-red-500"
    }

    const handleChangeTeachers = (idx: number, field: "name" | "email", value: string) => {
        setTeachers(
            (prev) => prev.map((teacher, i) => i === idx ? { ...teacher, [field]: value } : teacher)
        )
    }

    const handleAddTeacher = () => {
        setTeachers(
            [...teachers, { name: "", email: "" }]
        )
    }

    const handleRemoveTeacher = (idx: number) => {
        setTeachers(
            (prev) => prev.filter((_, i) => i !== idx)
        )
    }

    const handleChangeStudents = (idx: number, field: "name" | "email" | "studentNumber", value: string) => {
        setStudents(
            (prev) => prev.map((student, i) => i === idx ? { ...student, [field]: value } : student)
        )
    }

    const handleAddStudent = () => {
        setStudents(
            [...students, { name: "", email: "", studentNumber: "" }]
        )
    }

    const handleRemoveStudent = (idx: number) => {
        setStudents(
            (prev) => prev.filter((_, i) => i !== idx)
        )
    }

    const handleChangeProducts = (idx: number, field: "name" | "price", value: string) => {
        setProducts(
            (prev) => prev.map((product, i) => {
                if (i !== idx) return product;

                if (field === "price") {
                    if (!/^\d*\.?\d{0,2}$/.test(value)) return product;

                    const num = parseFloat(value);

                    return {
                        ...product,
                        priceInput: value,
                        price: isNaN(num) ? 0: num
                    };
                }

                return {
                    ...product,
                    name: value
                }
            })
        )
    }

    const handleAddProduct = () => {
        setProducts(
            [...products, { name: "", price: 0, priceInput: "" }]
        )
    }

    const handleRemoveProduct = (idx: number) => {
        setProducts(
            (prev) => prev.filter((_, i) => i !== idx)
        )
    }

    const handleSignIn = async () => {
        try {
            console.log("Starting Google sign-in process from UI");
            const userData = await loginWithGoogle();
            if (userData) {
                if ((userData.email.startsWith("p0") && userData.email.endsWith("@pdsb.net")) || userData.email === "795804@pdsb.net" || userData.email === "752470@pdsb.net" || userData.email === "843909@pdsb.net" || userData.email === "793546@pdsb.net") {
                    console.log("Signed in with", userData.email);
                    setSignedInTeacherEmail(userData.email);
                    setIsSignedIn(true);
                    setRespondentEmail((prev) => (prev.trim() ? prev : userData.email));
                    setRespondentName((prev) => (prev.trim() ? prev : (userData.name || "")));
                }
                else {
                    toast({
                        title: "Unsuccessful Login",
                        description: "Please create a booth request with a teacher @pdsb.net account.",
                        variant: "default"
                    })
                    navigate('/login', {
                        replace: true
                    });
                    setIsSignedIn(false);
                    return;
                }
            }
        } catch (error) {
            console.error('Google login error:', error);
        }
    };

    const DRAFT_STORAGE_KEY = signedInTeacherEmail
        ? `fraserpay_requestbooth_draft_v1:${signedInTeacherEmail.toLowerCase()}`
        : "fraserpay_requestbooth_draft_v1:unknown";

    const handleRestoreDraft = (restored: RequestBoothDraft) => {
        setRespondentName(restored?.respondentName ?? "");
        setRespondentEmail(restored?.respondentEmail ?? "");

        setTeachers(Array.isArray(restored?.teachers) ? restored.teachers.map((t) => ({
            name: t?.name ?? "",
            email: t?.email ?? "",
        })) : []);

        setStudents(Array.isArray(restored?.students) ? restored.students.map((s) => ({
            name: s?.name ?? "",
            email: s?.email ?? "",
            studentNumber: s?.studentNumber ?? "",
        })) : []);

        setBoothName(restored?.boothName ?? "");
        setBoothDescription(restored?.boothDescription ?? "");

        const restoredOrgType = restored?.organizationType;
        setOrganizationType(
            restoredOrgType === "Club/Council/Student Association" ||
            restoredOrgType === "Class" ||
            restoredOrgType === "Independent"
                ? restoredOrgType
                : "None"
        );
        setOrganizationInfo(restored?.organizationInfo ?? "");

        const restoredProducts = Array.isArray(restored?.products) ? restored.products : [];
        setProducts(
            restoredProducts.length > 0
                ? restoredProducts.map((p) => ({
                    name: p?.name ?? "",
                    price: typeof p?.price === "number" && !Number.isNaN(p.price) ? p.price : 0,
                    priceInput: p?.priceInput ?? "",
                }))
                : [{ name: "", price: 0, priceInput: "" }]
        );
    };

    const draft: RequestBoothDraft = useMemo(
        () => ({
            respondentName,
            respondentEmail,
            teachers,
            students,
            boothName,
            boothDescription,
            organizationType,
            organizationInfo,
            products,
        }),
        [
            respondentName,
            respondentEmail,
            teachers,
            students,
            boothName,
            boothDescription,
            organizationType,
            organizationInfo,
            products,
        ]
    );

    const validateForm = useCallback(() => {
        if (!respondentName.trim()) return false;
        if (!respondentEmail.trim()) return false;

        for (const teacher of teachers) {
            if (!teacher.name.trim()) return false;
            if (!teacher.email.trim()) return false;
        };

        for (const student of students) {
            if (!student.name.trim()) return false;
            if (!student.email.trim()) return false;
            if (!student.studentNumber.trim()) return false; 
        };

        if (!boothName.trim() || boothName.length < 3 || boothName.length > 20) return false;
        if (organizationType === "None") return false;
        if (!organizationInfo.trim()) return false;

        if (boothDescription.length > 100) return false;

        for (const product of products) {
            if (!product.name.trim() || product.name.length > 30) return false;
            if (product.price <= 0) return false;
        }

        return true;
    }, [
        respondentName,
        respondentEmail,
        teachers,
        students,
        boothName,
        boothDescription,
        organizationType,
        organizationInfo,
        products,
    ]);

    useEffect(() => {
        setIsValid(validateForm());
    }, [validateForm]);

    const handleSubmit = async () => {
        setSubmitStatus("submitting");
        const teachersArr = [{ name: respondentName, email: respondentEmail }, ...teachers];
        const studentsArr = students;
        // boothName, boothDescription, org type, org info
        const productsArr = products.map((product, i) => ({ name: product.name, price: product.price }));

        try {
            const boothsRequestsRef = collection(firestore, "booth_requests");
            await addDoc(boothsRequestsRef, {
                teachers: teachersArr,
                students: studentsArr,
                boothName: boothName,
                boothDescription: boothDescription,
                organizationType: organizationType,
                organizationInfo: organizationInfo,
                products: productsArr
            })

            setSubmitStatus("success")
            removeStorageItem(DRAFT_STORAGE_KEY);
        } catch (err) {
            toast({
                title: "Unsuccessful Submission",
                description: "Sorry, something went wrong. Please try again later.",
                variant: "destructive"
            })

            setSubmitStatus("error");
        }

    }




    return (
        <div className="w-full pt-8 p-2 py-16 flex justify-center place-items-center">

            {isSignedIn ? 
            <div className="flex flex-col place-items-center gap-y-2 max-w-[700px]">
                <div className="bg-gray-100 border-[2px] border-gray-200 p-2 rounded-lg text-pretty">
                    Welcome, teacher! We are very excited to have you join us for charity week. <br/><br/> Before you begin filling out this form, ensure you have the following: (you may have to ask your students for some of this information)
                    <ul className="list-disc pl-8">
                        <li>Names and school emails of all teachers who can supervise this booth.</li>
                        <li>Names, student numbers, and school emails of all (3+) student representatives of this booth.</li>
                        <li>The booth's name. <span className="text-sm text-gray-500">(3-20 characters)</span></li>
                        <li>The booth's description. <span className="text-sm text-gray-500">(max 100 characters)</span></li>
                        <li>The organization (or classroom #) associated with the booth.</li>
                        <li>A list of all products and their respective prices. <span className="text-sm text-gray-500">(product names max 30 characters)</span></li>
                    </ul>
                </div>

                <Section title="Questions?" description="SAC Contact Information">
                    <div className="">
                        <ul className="list-disc pl-8">
                            <li>Sohum - Tech Liaison - 795804@pdsb.net</li>
                            <li>Yang - Tech Liaison - 752470@pdsb.net</li>
                            <li>David - Vice President - 843909@pdsb.net</li>
                            <li>Hamza - President - 793546@pdsb.net</li>
                            <li>SAC - johnfraserstudentcouncil@gmail.com</li>
                        </ul>
                    </div>
                </Section>

                <Section title="Section 1 - Teacher Information" description="Information on all teachers involved">
                    <div className="w-full">
                        <StringInput label="YOUR Full Name" type="text" placeholder="Full Name" value={respondentName} onChange={(e) => setRespondentName(e.target.value)} required />
                        <StringInput label="YOUR Email" type="email" placeholder="Email" value={respondentEmail} onChange={(e) => setRespondentEmail(e.target.value)} required />
                        
                        <div className="flex place-items-start gap-x-2 justify-between">
                            <div className="py-1">
                                <div>Additional teachers</div>
                                {teachers.map((teacher, i) => 
                                    <div key={i} className="md:flex md:place-items-center">
                                        <StringInput label={`Teacher #${i+2} - Full Name`} type="text" placeholder="Full Name" value={teacher.name} onChange={(e) => handleChangeTeachers(i, "name", e.target.value)} required />
                                        <StringInput label={`Teacher #${i+2} - Email`} type="text" placeholder="Email" value={teacher.email} onChange={(e) => handleChangeTeachers(i, "email", e.target.value)} required />
                                        <div><button onClick={() => handleRemoveTeacher(i)} className="px-2 text-center font-bold rounded-sm hover:bg-red-500 hover:text-white">x</button></div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <button onClick={() => handleAddTeacher()} className="font-bold p-1 border-2 border-black rounded-lg text-sm hover:bg-black hover:text-white transition-all duration-200">Add Teacher</button>
                            </div>
                        </div>
                    </div>
                </Section>

                <Section title="Section 2 - Student Information" description="Information on all student representatives involved">
                    <div className="w-full">                        
                        <div className="flex place-items-start gap-x-2 justify-between">
                            <div className="py-1">
                                <div>Student Representatives</div>
                                {students.map((student, i) => 
                                    <div key={i}>
                                        <div className="my-8 flex place-items-center">
                                            <div>
                                                <StringInput label={`Student #${i+1} - Full Name`} type="text" placeholder="Full Name" value={student.name} onChange={(e) => handleChangeStudents(i, "name", e.target.value)} required />
                                                <StringInput label={`Student #${i+1} - Student Number`} type="text" placeholder="Student Number" value={student.studentNumber} onChange={(e) => handleChangeStudents(i, "studentNumber", e.target.value)} required />
                                                <StringInput label={`Student #${i+1} - Email`} type="text" placeholder="Email" value={student.email} onChange={(e) => handleChangeStudents(i, "email", e.target.value)} required />
                                            </div>
                                            <div><button onClick={() => handleRemoveStudent(i)} className="px-2 text-center font-bold rounded-sm hover:bg-red-500 hover:text-white" style={{ display: students.length > 3 ? "block" : "none"}}>x</button></div>
                                        </div>
                                        <hr className="border-[1px]"/>
                                    </div>
                                )}
                            </div>
                            <div>
                                <button onClick={() => handleAddStudent()} className="font-bold p-1 border-2 border-black rounded-lg text-sm hover:bg-black hover:text-white transition-all duration-200">Add Student</button>
                            </div>
                        </div>
                    </div>
                </Section>

                <Section title="Section 3 - Booth Information" description="All booth information">
                    <div className="w-full">
                        <div>
                            <StringInput label="Booth Name (max 20 characters)" type="text" placeholder="Booth Name" value={boothName} onChange={(e) => setBoothName(e.target.value)} minChars={3} maxChars={20} required />
                            <StringInput label="Booth Description (optional) (max 100 characters)" type="text" placeholder="Booth Description" value={boothDescription} onChange={(e) => setBoothDescription(e.target.value)} maxChars={100} />
                            
                            <div className="flex flex-col place-items-start gap-y-2 my-4 mx-2 relative">
                                <div className="text-gray-600 font-bold text-sm">Organization Type</div>
                                <div className="flex gap-x-2">
                                    <div className="flex place-items-center p-2 text-sm rounded-lg border-2 border-gray-100 hover:border-black  select-none my-1 hover:cursor-pointer transition-all duration-200" onClick={() => setOrganizationType("Club/Council/Student Association")} style={{ color: organizationType === "Club/Council/Student Association" ? "white" : "black", backgroundColor: organizationType === "Club/Council/Student Association" ? "black" : "white" }}>Club/Council/Student Association</div>
                                    <div className="flex place-items-center p-2 text-sm rounded-lg border-2 border-gray-100 hover:border-black select-none my-1 hover:cursor-pointer transition-all duration-200" onClick={() => setOrganizationType("Class")} style={{ color: organizationType === "Class" ? "white" : "black", backgroundColor: organizationType === "Class" ? "black" : "white" }}>Class</div>
                                    <div className="flex place-items-center p-2 text-sm rounded-lg border-2 border-gray-100 hover:border-black select-none my-1 hover:cursor-pointer transition-all duration-200" onClick={() => setOrganizationType("Independent")} style={{ color: organizationType === "Independent" ? "white" : "black", backgroundColor: organizationType === "Independent" ? "black" : "white" }}>Independent</div>
                                    
                                </div>
                                <div className="text-sm text-red-500">
                                    {
                                        organizationType === "None" ? "Please select an organization type." : ""
                                    }
                                </div>

                                <div className="text-gray-800 text-sm text-pretty">{`Important information for the text box below: If you selected "Club / Council / Student Association", input the name of the organization (no abbreviations). If you selected "Class", input the room # and Day 1 period of the class. If you selected "Independent", input "N/A".`}</div>
                                <StringInput label="Additional Organization Info" type="text" placeholder="Additional Info" value={organizationInfo} onChange={(e) => setOrganizationInfo(e.target.value)} required />
                            </div>
                        </div>
                        <div className="flex place-items-start gap-x-2 justify-between">
                            <div className="py-1">
                                <div>Products</div>
                                {products.map((product, i) => 
                                    <div key={i}>
                                        <div className="my-8 flex place-items-center">
                                            <div>
                                                <StringInput label={`Product #${i+1} - Name (max 30 characters)`} type="text" placeholder="Product Name" value={product.name} onChange={(e) => handleChangeProducts(i, "name", e.target.value)} required />
                                                <NumberInput label={`Product #${i+1} - Price ($)`} placeholder="Price" value={product.price} onChange={(e) => handleChangeProducts(i, "price", e.target.value)} />
                                            </div>
                                            <div><button onClick={() => handleRemoveProduct(i)} className="px-2 text-center font-bold rounded-sm hover:bg-red-500 hover:text-white" style={{ display: products.length > 1 ? "block" : "none"}}>x</button></div>
                                        </div>
                                        <hr className="border-[1px]"/>
                                    </div>
                                )}
                            </div>
                            <div>
                                <button onClick={() => handleAddProduct()} className="font-bold p-1 border-2 border-black rounded-lg text-sm hover:bg-black hover:text-white transition-all duration-200">Add Product</button>
                            </div>
                        </div>
                    </div>
                </Section>

                {submitStatus !== "success" && signedInTeacherEmail && (
                    <RequestBoothLocalDraft
                        storageKey={DRAFT_STORAGE_KEY}
                        draft={draft}
                        onRestore={handleRestoreDraft}
                        autoSave={true}
                        disabled={!isSignedIn || submitStatus !== "idle"}
                        showControls={true}
                    />
                )}

                <button 
                    onClick={() => handleSubmit()}
                    className={`mt-8 w-1/3 bg-gradient-to-r ${statusStyles[submitStatus]} p-2 text-white font-bold rounded-lg transition-all duration-100 outline-none`}
                    disabled={submitStatus !== "idle" || !isValid}
                    style={{
                        cursor: submitStatus === "idle" && isValid ? "pointer" : "not-allowed"
                    }}
                >
                    { submitStatus === "idle" ? "Submit" : submitStatus === "error" ? "Error" : submitStatus === "submitting" ? "Submitting..." : "Success!" }
                </button>
                <div className="text-sm text-red-500 text-center text-balance">
                    {
                        !isValid ?
                        "You cannot submit right now due to information being incorrectly filled. Please recheck the form for any errors with your responses. Please contact SAC if you think this message is a mistake."
                        :
                        ""
                    }
                </div>
                <div className="text-sm text-balance bg-gradient-to-r from-purple-300 to-purple-600 max-w-[500px] p-2 rounded-lg text-center font-bold text-white" style={{ display: submitStatus == "success" ? "block" : "none" }}>
                    Thank you for submitting your booth to be reviewed! SAC will be in touch with you in the coming weeks.
                </div>
            </div>
            :
            <div>
                <div className="text-lg font-bold text-center">FraserPay Booth Request Form</div>
                <button onClick={async () => await handleSignIn()} className="border-2 border-gray-400 hover:border-black hover:bg-gray-200 transition-all duration-200 p-2 rounded-lg">
                    Sign In (teacher account only)
                </button>
            </div>
            }
        </div>
    );
};

export default RequestBooth;