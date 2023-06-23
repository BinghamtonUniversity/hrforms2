import React, { useEffect, lazy } from "react";
import { Row, Col } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { Icon } from "@iconify/react";
import { DateFormat } from "../components";
import { EmploymentPositionInfoBox, FormTypeDisplay } from "../../pages/form";
import { useHRFormContext } from "../../config/form";
import { find, get, startCase } from "lodash";

//lazy load sections
const ReviewPersonInformation = lazy(()=>import("./review/review-person-information"));
const ReviewPersonDemographics = lazy(()=>import("./review/review-person-demographics"));
const ReviewPersonDirectory = lazy(()=>import("./review/review-person-directory"));
const ReviewPersonEducation = lazy(()=>import("./review/review-person-education"));
const ReviewPersonContacts = lazy(()=>import("./review/review-person-contacts"));
const ReviewEmploymentPosition = lazy(()=>import("./review/review-employment-position"));
const ReviewEmploymentAppointment = lazy(()=>import("./review/review-employment-appointment"));
const ReviewEmploymentSalary = lazy(()=>import("./review/review-employment-salary"));
const ReviewEmploymentSeparation = lazy(()=>import("./review/review-employment-separation"));
const ReviewEmploymentLeave = lazy(()=>import("./review/review-employment-leave"));
const ReviewEmploymentPay = lazy(()=>import("./review/review-employment-pay"));
const ReviewEmploymentVolunteer = lazy(()=>import("./review/review-employment-volunteer"));
const ReviewComments = lazy(()=>import("./review/review-comments"));

export default function Review() {
    const { getValues } = useFormContext();
    const { journalStatus } = useHRFormContext();
    useEffect(()=>{
        console.debug(getValues());
    },[]);
    return (
        <article id="form-review" className="mt-3">
            {journalStatus!='Z' && 
                <Row as="header">
                    <Col as="h3">Review</Col>
                </Row>
            }
            <ReviewFormData/>
            <ReviewSections/>
            <ReviewComments/>
        </article>
    );
}

export function NewLine({gap}) { 
    let c = 'w-100';
    if (gap != undefined) c += ` mt-${gap}`;
    return (<div className={c}></div>); 
}

function ReviewFormData() {
    const { getValues } = useFormContext();
    const { isNew } = useHRFormContext(); //TODO:change isNew to isDraft
    const [formId,payroll,effDate] = getValues(['formId','payroll','effDate']);
    return (
        <section className="mb-4">
            <Row as="header">
                <Col>
                    <h4 className="border-bottom border-main">Form Data</h4>
                </Col>
            </Row>
            <Row as="dl" className="mb-0">
                <Col as="dt" md={2} className="mb-0">Form ID:</Col>
                <Col as="dd" md={10} className="mb-0">{formId} {isNew && <span className="text-warning">[<Icon className="iconify-inline" icon="mdi:alert"/>not saved]</span>}</Col>
                <Col as="dt" md={2} className="mb-0">Form Type:</Col>
                <Col as="dd" md={10} className="mb-0"><FormTypeDisplay/></Col>
                <Col as="dt" md={2} className="mb-0">Payroll:</Col>
                <Col as="dd" md={10} className="mb-0">{payroll?.title||payroll.PAYROLL_TITLE}</Col>
                <Col as="dt" md={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" md={10} className="mb-0"><DateFormat>{effDate}</DateFormat></Col>
            </Row>
        </section>
    );
}

function ReviewSectionRouter({tab}) {
    switch(tab) {
        case "person-information": return <ReviewPersonInformation/>; break;
        case "person-demographics": return <ReviewPersonDemographics/>; break;
        case "person-directory": return <ReviewPersonDirectory/>; break;
        case "person-education": return <ReviewPersonEducation/>; break;
        case "person-contacts": return <ReviewPersonContacts/>; break;
        case "employment-position": return <ReviewEmploymentPosition/>; break;
        case "employment-appointment": return <ReviewEmploymentAppointment/>; break;
        case "employment-salary": return <ReviewEmploymentSalary/>; break;
        case "employment-separation": return <ReviewEmploymentSeparation/>; break;
        case "employment-leave": return <ReviewEmploymentLeave/>; break;
        case "employment-pay": return <ReviewEmploymentPay/>; break;
        case "employment-volunteer": return <ReviewEmploymentVolunteer/>; break;
        default: return null;
    }
}

function ReviewSections() {
    const tabGroups = ['person','employment'];
    const { tabs } = useHRFormContext();
    return (
        <>
            {tabGroups.map(tg => {
                const t = get(find(tabs,['value',tg]),'children',[]);
                if (t.length == 0) return null;
                return (
                    <section key={tg} className="mb-4">
                        <Row as="header">
                            <Col>
                                <h4 className="border-bottom border-main">{startCase(tg)} Data</h4>
                            </Col>
                        </Row>
                        {(tg == 'employment') && 
                            <article className="border rounded p-1 mb-2">
                                <EmploymentPositionInfoBox/>
                            </article>
                        }
                        {t.map(s=><ReviewSectionRouter key={s.value} tab={s.value}/>)}
                    </section>
                );
            })}
        </>
    )
}
