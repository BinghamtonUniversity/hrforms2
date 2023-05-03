import React, { useCallback } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { SettingsContext, useAuthContext, useSettingsContext, useUserContext } from "../../../app";
import format from "date-fns/format";
import { Icon } from "@iconify/react";

export default function SettingsRequests() {
    const { control } = useFormContext();
    const menuFields = useWatch({name:'requests.menu',control:control});
    const watchEmailEnabled = useWatch({name:'requests.email.enabled',control:control});
    const { requests } = useSettingsContext();
    const disabled = useCallback(field => {
        const k = field.name.split('.')[2];
        return (Object.keys(menuFields[k]).includes('enabled'))?!menuFields[k].enabled:false;
    },[menuFields]);
    return (
        <>
            <section>
                {Object.keys(requests.menu).map(k=>(
                    <Form.Group key={k} as={Row} controlId={k}>
                        <Form.Label column md={2}>{k}:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`requests.menu.${k}.title`}
                                control={control}
                                defaultValue={requests.menu[k].title}
                                render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Title" disabled={disabled(field)}/>}
                            />
                        </Col>
                        <Col xs="auto">
                            <Controller
                                name={`requests.menu.${k}.showOnHome`}
                                control={control}
                                render={({field}) => <Form.Check {...field} type="checkbox" inline label="Show On Home" checked={field.value} disabled={disabled(field)}/>}
                            />
                        </Col>
                        <Col xs="auto">
                            <Controller
                                name={`requests.menu.${k}.showOnMenu`}
                                control={control}
                                render={({field}) => <Form.Check {...field} type="checkbox" inline label="Show On Menu" checked={field.value} disabled={disabled(field)}/>}
                            />
                        </Col>
                        {Object.keys(requests.menu[k]).includes('sendEmail') && 
                            <Col xs="auto">
                                <Controller
                                    name={`requests.menu.${k}.sendEmail`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} className={(!watchEmailEnabled&&field.value)?'text-danger':''} type="checkbox" inline label={<>Send Email{(!watchEmailEnabled&&field.value)&&<Icon className="iconify-inline mt-1" icon="mdi:alert-circle"/>}</>} checked={field.value} disabled={disabled(field)}/>}
                                />
                                {(!watchEmailEnabled&&requests.menu[k].sendEmail)&&<Form.Text id="emailErrorsHelp" className="text-danger mt-0">Notifications Disabled</Form.Text>}
                            </Col>
                        }
                        {Object.keys(requests.menu[k]).includes('enabled') && 
                            <Col xs="auto">
                                <Controller
                                    name={`requests.menu.${k}.enabled`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" inline label="Enabled" checked={field.value}/>}
                                />
                            </Col>
                        }
                    </Form.Group>
                ))}
            </section>
            <SettingsRequestsEmail/>
        </>
    );
}

function SettingsRequestsEmail() {
    const { control } = useFormContext();
    const enabled = useWatch({name:'requests.email.enabled',control:control});
    return (
        <>
            <section>
                <Row as="header" className="mt-3">
                    <Col as="h4">Email Configuration</Col>
                </Row>
                <Form.Group as={Row} controlId="emailEnabled">
                    <Form.Label column md={2}>Enable Notifications:</Form.Label>
                    <Col xs="auto" className="pt-2">
                        <Controller
                            name='requests.email.enabled'
                            control={control}
                            render={({field}) => <Form.Check {...field} type="checkbox" checked={!!field.value}/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailFromName">
                    <Form.Label column md={2}>From Name (optional):</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='requests.email.name'
                            control={control}
                            render={({field}) => <Form.Control {...field} type="text" placeholder="Enter From Email Name" disabled={!enabled}/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailFrom">
                    <Form.Label column md={2}>From Email:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='requests.email.from'
                            control={control}
                            render={({field}) => <Form.Control {...field} type="email" placeholder="Enter From Email Address" disabled={!enabled} />}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailSubject">
                    <Form.Label column md={2}>Email Subject:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='requests.email.subject'
                            control={control}
                            render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Email Subject" disabled={!enabled} />}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailDefault">
                    <Form.Label column md={2}>Default Email:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='requests.email.default'
                            control={control}
                            render={({field}) => <Form.Control {...field} type="email" placeholder="Enter Default To Email Address" aria-describedby="emailDefaultHelp" disabled={!enabled}/>}
                        />
                    </Col>
                    <Col>
                        <Form.Text id="emailDefaultHelp" className="pt-1" muted>Default email to send to when there are no approval group members or no members set to receive email notifications.</Form.Text>
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="emailErrors">
                    <Form.Label column md={2}>Errors Email:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name='requests.email.errors'
                            control={control}
                            render={({field}) => <Form.Control {...field} type="email" placeholder="Enter Email Address" aria-describedby="emailErrorsHelp" disabled={!enabled}/>}
                        />
                    </Col>
                    <Col>
                        <Form.Text id="emailErrorsHelp" className="pt-1" muted>Email to send errors to.</Form.Text>
                    </Col>
                </Form.Group>
            </section>
            <SampleRequestEmail enabled={enabled}/>
        </>
    );
}

function SampleRequestEmail({enabled}) {
    const { control } = useFormContext();
    const fields = useWatch({name:'requests.email',control:control});
    const now = new Date();
    const {INSTANCE:instance} = useAuthContext();
    const {EMAIL_ADDRESS_WORK:email,fullname} = useUserContext();
    return (
        <section>
            <Row as="header" className="mt-3">
                <Col as="h4">Sample Email</Col>
            </Row>
            <Row>
                <Col>
                    {enabled?
                        <pre>
                            <p>Date: {format(now,'E, d MMM yyyy HH:mm:ss XX')}</p>
                            <p>From: "{fields.name}" &lt;{fields.from}&gt;</p>
                            <p>To: "{fullname}" &lt;{email}&gt;</p>
                            <p>Subject: [HRFORMS2-{instance}]: {fields.subject}</p>
                        </pre>
                    :
                        <p>Not Enabled</p>
                    }
                </Col>
            </Row>
        </section>
    );
}
//Fri, 28 Apr 2023 09:53:47 -0400
//e, d MM YYYY HH:mm:ss XX 