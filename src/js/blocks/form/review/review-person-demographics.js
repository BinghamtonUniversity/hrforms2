import React from "react";
import { Row, Col } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { DateFormat } from "../../components";
import { NewLine } from "../review";

export default function ReviewPersonDemographics() {
    const { getValues } = useFormContext();
    const [demo] = getValues(['person.demographics']);
    return (
        <article className="border rounded p-1 mb-2">
            <Row as="header">
                <Col as="h5">Demographics</Col>
            </Row>
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={3} md={2} className="mb-0">Date of Birth:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat>{demo.birthDate}</DateFormat></Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Legal Sex:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{demo.GENDER.label}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Gender Identity:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{demo.GENDER_IDENTITY.label}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">US Citizen:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{(demo.US_CITIZEN_INDICATOR=="Y")?"Yes":"No"}</Col>
                {(demo.US_CITIZEN_INDICATOR!="Y")&&
                    <>
                        <Col as="dt" sm={3} md={2} className="mb-0">Non-US Citizen Type:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{Object.values(demo.NON_CITIZEN_TYPE).join(' - ')}</Col>
                        {(demo.NON_CITIZEN_TYPE?.id=='OT')&&
                            <>
                                <Col as="dt" sm={3} md={2} className="mb-0">Emp Auth Card Only:</Col>
                                <Col as="dd" sm={9} md={4} className="mb-0">{(demo.EMP_AUTHORIZE_CARD_INDICATOR=="Y")?"Yes":"No"}</Col>
                            </>
                        }
                        <Col as="dt" sm={3} md={2} className="mb-0">Country of Citizenship:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{demo.CITIZENSHIP_COUNTRY_CODE.label}</Col>
                        <Col as="dt" sm={3} md={2} className="mb-0">Visa Type:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{demo.VISA_CODE.label}</Col>
                    </>
                }
                <NewLine gap={3}/>
                <Col as="dt" sm={3} md={2} className="mb-0">Military Status:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">
                    {demo.militaryStatus.map(s=><p key={s[0]} className="mb-0">{s[1]}</p>)}
                </Col>
                <NewLine gap={3}/>
                <Col as="dt" sm={3} md={2} className="mb-0">Veteran:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{(demo.VETERAN_INDICATOR=="Y")?"Yes":"No"}</Col>
                {(demo.VETERAN_INDICATOR=="Y")&&
                    <>
                        <Col as="dt" sm={3} md={2} className="mb-0">Protected Vet Status:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">
                            {demo.protectedVetStatus.map(s=><p key={s[0]} className="mb-0">{s[1]}</p>)}
                        </Col>
                        <Col as="dt" sm={3} md={2} className="mb-0">Military Sep Date:</Col>
                        <Col as="dd" sm={3} md={4} className="mb-0"><DateFormat>{demo.militarySepDate}</DateFormat></Col>
                    </>
                }
            </Row>
        </article>
    );
}