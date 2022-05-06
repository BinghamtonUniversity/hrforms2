import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import { useFormContext, Controller } from "react-hook-form";
import { SettingsContext } from "../../../app";

export default function SettingsRequests() {
    const {control} = useFormContext();
    return (
        <SettingsContext.Consumer>
            {({requests}) => (
                <>
                    {Object.keys(requests.menu).map(k=>(
                        <Form.Group key={k} as={Row} controlId={k}>
                            <Form.Label column md={2}>{k}:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`requests.menu.${k}.title`}
                                    control={control}
                                    defaultValue={requests.menu[k].title}
                                    render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Title" />}
                                />
                            </Col>
                            <Col xs="auto">
                                <Controller
                                    name={`requests.menu.${k}.showOnHome`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" inline label="Show On Home" checked={field.value}/>}
                                />
                            </Col>
                            <Col xs="auto">
                                <Controller
                                    name={`requests.menu.${k}.showOnMenu`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" inline label="Show On Menu" checked={field.value}/>}
                                />
                            </Col>
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
                    <Row as="header">
                        <Col as="h4">Email Configuration</Col>
                    </Row>
                    <Form.Group as={Row} controlId="emailHost">
                        <Form.Label column md={2}>Hostname:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name='requests.email.host'
                                control={control}
                                defaultValue={requests.email.host}
                                render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Hostname" />}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} controlId="emailFrom">
                        <Form.Label column md={2}>From:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name='requests.email.from'
                                control={control}
                                defaultValue={requests.email.host}
                                render={({field}) => <Form.Control {...field} type="email" placeholder="Enter From Email Address" />}
                            />
                        </Col>
                    </Form.Group>
                </>
            )}
        </SettingsContext.Consumer>
    );
}

