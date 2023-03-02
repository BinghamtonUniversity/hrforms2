import React from "react";
import { Row, Col } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { startCase, upperCase } from "lodash";

export default function ReviewPersonContacts() {
    const { getValues } = useFormContext();
    const [contacts] = getValues(['person.contact.contacts']);
    return (
        <article className="border rounded p-1 mb-2">
            <Row as="header">
                <Col as="h5">Contacts</Col>
            </Row>
            <Row>
                {contacts.map((c,i) => (
                    <Col key={i} md={6} className={`mb-md-0 ${(i<contacts.length-1)?"mb-sm-4":""}`}>
                        <Row as="dl" className="mb-0">
                            <Col as="dt" md={4} className="mb-0">Primary:</Col>
                            <Col as="dd" md={8} className="mb-0">{(c.isPrimary)=="Y"?"Yes":"No"}</Col>
                            <Col as="dt" md={4} className="mb-0">Name:</Col>
                            <Col as="dd" md={8} className="mb-0">{[c.EMR_CTC_FIRST_NAME,c.EMR_CTC_LAST_NAME].join(' ')}</Col>
                            <Col as="dt" md={4} className="mb-0">Address:</Col>
                            <Col as="dd" md={8} className="mb-0">
                                <address>
                                    <p className="mb-0">{c.EMR_CTC_ADDRESS_1}</p>
                                    {c.EMR_CTC_ADDRESS_2 && <p className="mb-0">{c.EMR_CTC_ADDRESS_2}</p>}
                                    <p className="mb-0">{c.EMR_CTC_CITY}, {c.EMR_CTC_STATE_CODE} {c.EMR_CTC_ZIP}</p>
                                    <p className="mb-0">{c.EMR_CTC_COUNTRY_CODE.label}</p>
                                </address>
                            </Col>
                            {['day','night','international','cell'].map(p => (
                                <React.Fragment key={p}>
                                    <Col as="dt" md={4} className="mb-0">{startCase(p)} Phone:</Col>
                                    <Col as="dd" md={8} className="mb-0">{c[`EMR_CTC_${upperCase(p)}_PHONE`]}</Col>
                                </React.Fragment>
                            ))}
                            <Col as="dt" md={4} className="mb-0">Email Address:</Col>
                            <Col as="dd" md={8} className="mb-0">{c.EMR_CTC_EMAIL}</Col>
                            <Col as="dt" md={4} className="mb-0">Relationship:</Col>
                            <Col as="dd" md={8} className="mb-0">{c.EMR_CTC_RELATIONSHIP.label}</Col>
                        </Row>
                    </Col>
                ))}
            </Row>
        </article>
    );
}