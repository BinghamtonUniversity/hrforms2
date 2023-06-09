import React, { useCallback } from "react";
import { Form, Row, Col, Table } from "react-bootstrap";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { useSettingsContext } from "../../../app";

export default function SettingsRequests() {
    const { control } = useFormContext();
    const menuFields = useWatch({name:'requests.menu',control:control});
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
                        {Object.keys(requests.menu[k]).includes('resubmit') && 
                            <Col xs="auto">
                                <Controller
                                    name={`requests.menu.${k}.resubmit`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" inline label="Allow Resubmit" checked={field.value} disabled={disabled(field)}/>}
                                />
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
            {enabled && <SettingsRequestsEmailStatus/>}
        </>
    );
}

function SettingsRequestsEmailStatus() {
    const { control } = useFormContext();
    const { requests } = useSettingsContext();
    const mailOptions = [
        ["submitter","Submitter"],
        ["group_to","Group To"],
        ["group_from","Group From"],
        ["default","Default"],
        ["error","Error"]
    ];
    const replyToOptions = [
        ["none","None"],
        ["submitter","Submitter"],
        ["default","Default"],
        ["error","Error"]
    ];
    return (
        <>
            <Table striped bordered>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Subject</th>
                        <th>Email To</th>
                        <th>Email Cc</th>
                        <th>Email Reply-To</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(requests.email.status).map(s => (
                        <tr key={s}>
                            <td>{s}</td>
                            <td>
                                <Controller
                                    name={`requests.email.status.${s}.subject`}
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Subject"/>}
                                />
                            </td>
                            <td>{mailOptions.map(o=>(
                                <Controller
                                    key={`mailto_${o[0]}`}
                                    name={`requests.email.status.${s}.mailto.${o[0]}`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" label={o[1]} checked={field.value}/>}
                                />
                            ))}</td>
                            <td>{mailOptions.map(o=>(
                                <Controller
                                    key={`mailcc_${o[0]}`}
                                    name={`requests.email.status.${s}.mailcc.${o[0]}`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" label={o[1]} checked={field.value}/>}
                                />
                            ))}</td>
                            <td>{replyToOptions.map(o=>(
                                <Controller
                                    key={`mailcc_${o[0]}`}
                                    name={`requests.email.status.${s}.replyto`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="radio" label={o[1]} value={o[0]} checked={field.value==o[0]}/>}
                                />
                            ))}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
}
