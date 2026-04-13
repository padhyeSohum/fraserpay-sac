import React, { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { loginWithGoogle } from "@/contexts/auth/authOperations";
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from "react-router-dom";
import { addDoc, collection } from "firebase/firestore";
import { firestore } from "@/integrations/firebase/client";
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
    description?: string,
    type: string,
    placeholder: string,
    value: string,
    onChange: any,
    minChars?: number,
    maxChars?: number,
    required?: boolean,
}
const StringInput = ({ label, description = "", type, placeholder, value, onChange, minChars = 0, maxChars = -1, required }: StringInputProps) => {

    return (
        <div className="flex flex-col place-items-start gap-y-2 my-4 mx-2">
            <div className="text-gray-600 font-bold text-sm">{label}</div>
            <div className="text-gray-400 text-sm">{description}</div>
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
    description? : string,
    placeholder: string,
    value: number,
    onChange: any,
}
const NumberInput = ({ label, description, placeholder, value, onChange }: NumberInputProps) => {
    return (
        <div className="flex flex-col place-items-start gap-y-2 my-4 mx-2">
            <div className="text-gray-600 font-bold text-sm">{label}</div>
            <div className="text-gray-400 text-sm">{description}</div>
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

const RequestBooth = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isSignedIn, setIsSignedIn] = useState(false);

    const [respondentName, setRespondentName] = useState("");
    const [respondentEmail, setRespondentEmail] = useState("");
    const [teachers, setTeachers] = useState([]);

    const [boothName, setBoothName] = useState("");
    const [boothDescription, setBoothDescription] = useState("");
    const [groupType, setGroupType] = useState<"None" | "Club" | "Class">("None");
    const [groupInfo, setGroupInfo] = useState("");
    const [sellingDates, setSellingDates] = useState(Array(5).fill(false));
    const [numSellingDates, setNumSellingDates] = useState(0);
    const [products, setProducts] = useState([{ name: "", price: 0, priceInput: "" }]);

    const [additionalInformation, setAdditionalInformation] = useState("");

    const [isValid, setIsValid] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<"error" | "idle" | "submitting" | "success">("idle");

    const statusStyles = {
        idle: "from-purple-500 to-purple-700 hover:shadow-[0_0_35px_rgba(147,60,227,0.25)]",
        submitting: "from-purple-500 to-purple-700",
        success: "from-green-300 to-green-600 hover:shadow-[0_0_35px_rgba(78,200,123,0.25)]",
        error: "from-red-300 to-red-500"
    }

    const CHARITY_WEEK_DATES = [
        "Monday, April 27",
        "Tuesday, April 28",
        "Wednesday, April 29",
        "Thursday, April 30",
        "Friday, May 1"
    ];

    const handleChangeSellingDates = (idx: number) => {
        if (sellingDates[idx] === false) {
            // they are changing it from false to true
            setNumSellingDates(numSellingDates+1);
        } else {
            // changing from true to false
            setNumSellingDates(numSellingDates-1);
        }
        setSellingDates(
            (prev) => prev.map((isSelling, i) => i === idx ? !isSelling : isSelling)
        )
    }

    const handleChangeProducts = (idx: number, field: "name" | "price", value: any) => {
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
                let isAuthorizedUser = false;
                const authorizedEmails = ["795804@pdsb.net", "752470@pdsb.net", "793546@pdsb.net", "843909@pdsb.net"];
                for (const email of authorizedEmails) {
                    if (userData.email === email) {
                        isAuthorizedUser = true;
                        break;
                    }
                }

                if ((userData.email.startsWith("p0") && userData.email.endsWith("@pdsb.net")) || userData.email.endsWith("@peelsb.com") || isAuthorizedUser) {
                    console.log("Signed in with", userData.email);
                    setIsSignedIn(true);
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

    const validateForm = () => {
        if (!respondentName.trim()) return false;
        if (!respondentEmail.trim()) return false;

        for (const teacher of teachers) {
            if (!teacher.name.trim()) return false;
            if (!teacher.email.trim()) return false;
        };

        if (!boothName.trim() || boothName.length < 3 || boothName.length > 30) return false;
        if (groupType === "None") return false;
        if (!groupInfo.trim()) return false;

        if (boothDescription.length > 100) return false;

        if (numSellingDates === 0) return false;

        for (const product of products) {
            if (!product.name.trim() || product.name.length > 30) return false;
            if (product.price <= 0) return false;
        }

        return true;
    }

    useEffect(() => {
        setIsValid(validateForm());
    }, [
        respondentName,
        respondentEmail,
        teachers,
        boothName,
        boothDescription,
        groupType,
        groupInfo,
        sellingDates,
        products
    ]);

    const handleSubmit = async () => {
        setSubmitStatus("submitting");
        const teachersArr = [{ name: respondentName, email: respondentEmail }, ...teachers];
        const productsArr = products.map((product, i) => ({ name: product.name, price: product.price*100 }));

        try {
            const boothRequestsCollection = collection(firestore, "booth_requests");
            await addDoc(boothRequestsCollection, {
                teachers: teachersArr,
                boothName: boothName,
                boothDescription: boothDescription,
                groupType: groupType,
                groupInfo: groupInfo,
                products: productsArr,
                status: "pending",
                additionalInformation: additionalInformation,
                sellingDates: sellingDates
            })

            setSubmitStatus("success")
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
                <div className="bg-red-500 text-white p-2 rounded-lg text-pretty">
                    Warning: This form does <b>not</b> save partially completed responses. If you would like to leave this form and come back to it later, we strongly suggest that you save your responses somewhere else.
                </div>

                <div className="bg-gray-100 border-[2px] border-gray-200 p-2 rounded-lg text-pretty">
                    Welcome, teacher! We are very excited to have you join us for charity week. <br/><br/> Before you begin filling out this form, ensure you have the following: (you may have to ask your students for some of this information)
                    <ul className="list-disc pl-8">
                        <li>Your name and email.</li>
                        <li>The booth's name. <span className="text-sm text-gray-500">(3-30 characters)</span></li>
                        <li>The booth's description. <span className="text-sm text-gray-500">(max 100 characters)</span></li>
                        <li>The club or classroom # associated with the booth (if a classroom is running the booth).</li>
                        <li>What dates you expect your booth to run on throughout Charity Week.</li>
                        <li>A list of all products and their respective prices. <span className="text-sm text-gray-500">(product names max 30 characters)</span></li>
                    </ul>
                </div>

                <Section title="Questions?" description="SAC Contact Information">
                    <div className="">
                        <div className="font-bold mt-2">If you have questions about what to fill in the form:</div>
                        <ul className="list-disc pl-8">
                            <li>Ms. Sinclair - Teacher - p0042314@pdsb.net</li>
                            <li>Hamza - President - 793546@pdsb.net</li>
                            <li>David - Vice President - 843909@pdsb.net</li>
                            <li>SAC - johnfraserstudentcouncil@gmail.com</li>
                        </ul>

                        <div className="font-bold mt-2">If you are experiencing technical difficulties with the form:</div>
                        <ul className="list-disc pl-8">
                            <li>Sohum - Tech Liaison - 795804@pdsb.net</li>
                            <li>Yang - Tech Liaison - 752470@pdsb.net</li>
                        </ul>
                    </div>
                </Section>

                <Section title="Section 1 - Teacher Information" description="We use this information to contact you if we require additional information, or if we need to reach you.">
                    <div className="w-full">
                        <StringInput label="Your Full Name" type="text" placeholder="Full Name" value={respondentName} onChange={(e) => setRespondentName(e.target.value)} required />
                        <StringInput label="Your Email" type="email" placeholder="Email" value={respondentEmail} onChange={(e) => setRespondentEmail(e.target.value)} required />
                    </div>
                </Section>

                <Section title="Section 2 - Booth Information" description="All booth information">
                    <div className="w-full">
                        <div>
                            <StringInput label="Booth Name (max 30 characters)" description="This will be the booth name that shows up on FraserPay." type="text" placeholder="Ex. SAC's Barbeque" value={boothName} onChange={(e) => setBoothName(e.target.value)} minChars={3} maxChars={30} required />
                            {/* <StringInput label="Booth Description (optional) (max 100 characters)" type="text" placeholder="Booth Description" value={boothDescription} onChange={(e) => setBoothDescription(e.target.value)} maxChars={100} /> */}
                            <div className="flex flex-col place-items-center gap-y-2 my-4 mx-2">
                                <div className="text-gray-600 font-bold text-sm w-full text-left">Booth Description (optional) (max 100 characters)</div>
                                <div className="text-gray-400 text-sm w-full text-left">This will be the booth description that shows up on FraserPay.</div>
                                <textarea 
                                    placeholder="Ex. Stop by for some great burgers and hot dogs!"
                                    value={boothDescription} 
                                    onChange={(e) => setBoothDescription(e.target.value)} 
                                    className="p-2 mx-2 w-full text-sm rounded-lg border-2 border-gray-200 outline-none placeholder-gray-400 focus:bg-gray-200 hover:border-gray-400 focus:border-gray-400 transition-colors duration-200"
                                />
                                <div className="text-sm text-red-500 w-full text-left">
                                    {
                                        boothDescription.length > 100 
                                        ?
                                        `Character count must not exceed 100` 
                                        : ""
                                    }
                                </div>
                            </div>
                            <div className="flex flex-col place-items-start gap-y-2 my-4 mx-2 relative">
                                <div className="text-gray-600 font-bold text-sm">Group Type</div>
                                <div className="flex gap-x-2">
                                    <div className="flex place-items-center p-2 text-sm rounded-lg border-2 border-gray-100 hover:border-black  select-none my-1 hover:cursor-pointer transition-all duration-200" onClick={() => setGroupType("Club")} style={{ color: groupType === "Club" ? "white" : "black", backgroundColor: groupType === "Club" ? "black" : "white" }}>Club</div>
                                    <div className="flex place-items-center p-2 text-sm rounded-lg border-2 border-gray-100 hover:border-black select-none my-1 hover:cursor-pointer transition-all duration-200" onClick={() => setGroupType("Class")} style={{ color: groupType === "Class" ? "white" : "black", backgroundColor: groupType === "Class" ? "black" : "white" }}>Class</div>                                    
                                </div>
                                <div className="text-sm text-red-500">
                                    {
                                        groupType === "None" ? "Please select a group type." : ""
                                    }
                                </div>

                                <div className="text-gray-800 text-sm text-pretty">{`Important information for the text box below: If you selected "Club", input the full name of the club (no abbreviations). If you selected "Class", input the room # of the class.`}</div>
                                <StringInput label="Additional Group Info" type="text" placeholder="Ex. Student Activity Council" value={groupInfo} onChange={(e) => setGroupInfo(e.target.value)} required />
                            </div>
                        </div>
                        <div className="flex flex-col place-items-start gap-y-2 my-4 mx-2 relative">
                            <div className="text-gray-600 font-bold text-sm">Selling Dates</div>
                            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {
                                    sellingDates.map((_, i) => (
                                        <div key={i} className="flex place-items-center p-2 text-xs rounded-lg border-2 border-gray-100 hover:border-black  select-none my-1 hover:cursor-pointer transition-all duration-200" style={{ color: sellingDates[i] ? "white": "black", backgroundColor: sellingDates[i] ? "black" : "white" }} onClick={() => handleChangeSellingDates(i)}>{CHARITY_WEEK_DATES[i]}</div>
                                    ))
                                }
                            </div>
                            <div className="text-sm text-red-500">
                                {
                                    numSellingDates === 0 ? "Please select at least one day to run your booth." : ""
                                }
                            </div>

                        </div>
                        <div className="flex place-items-start gap-x-2 justify-between">
                            <div className="py-1">
                                <div>Products</div>
                                {products.map((product, i) => 
                                    <div key={i}>
                                        <div className="my-8 flex place-items-center">
                                            <div>
                                                <StringInput label={`Product #${i+1} - Name (max 30 characters)`} description="This will be visible on FraserPay." type="text" placeholder="Product Name" value={product.name} onChange={(e) => handleChangeProducts(i, "name", e.target.value)} required />
                                                <NumberInput label={`Product #${i+1} - Price ($)`} description="This will be visible on FraserPay." placeholder="Price" value={product.price} onChange={(e) => handleChangeProducts(i, "price", e.target.value)} />
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
                <Section title="Section 3 - Additional Information" description="Any additional information you would like SAC to know about your request">
                    <div className="flex flex-col place-items-center gap-y-2 my-4 mx-2">
                        <div className="text-sm w-full text-left">Please do not use this area to ask questions. If you have any questions, you are welcome to use the contact information at the top of the form. If your booth <b><u>REQUIRES</u></b> any accommodations, let us know here. We do not do spot requests. If there is any other information you feel we should know, you are welcome to write it here.</div>
                        <textarea 
                            placeholder="Ex. We are using a barbeque grill. We need to be placed outside and close to an outlet."
                            value={additionalInformation} 
                            onChange={(e) => setAdditionalInformation(e.target.value)} 
                            className="p-2 mx-2 w-full text-sm rounded-lg border-2 border-gray-200 outline-none placeholder-gray-400 focus:bg-gray-200 hover:border-gray-400 focus:border-gray-400 transition-colors duration-200"
                        />
                    </div>
                </Section>

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
                        "You cannot submit right now due to information being incorrectly or incompletely filled. Please recheck the form for any errors with your responses. Please contact SAC if you think this message is a mistake."
                        :
                        ""
                    }
                </div>
                <div className="text-sm text-balance bg-gradient-to-r from-purple-300 to-purple-600 max-w-[500px] p-2 rounded-lg text-center font-bold text-white" style={{ display: submitStatus == "success" ? "block" : "none" }}>
                    Thank you for submitting your booth to be reviewed! SAC will be in touch with you in the coming weeks. Do not hesitate to reach out to SAC should any questions arise!
                </div>
            </div>
            :
            <div>
                <div className="text-lg font-bold text-center">FraserPay Booth Request Form</div>
                <button onClick={async () => await handleSignIn()} className="border-2 border-gray-400 hover:border-black hover:bg-gray-200 transition-all duration-200 p-2 rounded-lg">
                    Sign In (teacher @pdsb.net or @peelsb.com account only)
                </button>
            </div>
            }
        </div>
    );
};

export default RequestBooth;