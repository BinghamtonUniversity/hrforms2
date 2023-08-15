import React from 'react';
import { Form, Row, Col, Table } from "react-bootstrap";
import { useFormContext, Controller } from "react-hook-form";
import { useSettingsContext } from "../../../app";

export default function SettingsWorkflow() {
    const { control, formState:{ errors }} = useFormContext();
    return (
        <>
            <section>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Show Request Workflow:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="general.showReqWF"
                            defaultValue="Y"
                            control={control}
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" id="showReqWF-all" label="All" value='Y' checked={field.value==='Y'}/>
                                    <Form.Check {...field} inline type="radio" id="showReqWF-admin" label="Admin Only" value='A' checked={field.value==='A'}/>
                                    <Form.Check {...field} inline type="radio" id="showReqWF-none" label="None" value='N' onChange={()=>field.onChange('N')} checked={field.value==='N'}/>
                                </>
                            )}
                        />
                        <Form.Text id="showReqWFHelp" muted>Toggle display of workflow on Requests lists</Form.Text>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Show Form Workflow:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="general.showFormWF"
                            control={control}
                            defaultValue="A"
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" id="showFormWF-all" label="All" value='Y' checked={field.value=='Y'}/>
                                    <Form.Check {...field} inline type="radio" id="showFormWF-admin" label="Admin Only" value='A' checked={field.value=='A'}/>
                                    <Form.Check {...field} inline type="radio" id="showFormWF-none" label="None" value='N' checked={field.value=='N'}/>
                                    <Form.Text id="showFormWFHelp" muted>Toggle display of workflow on Forms lists</Form.Text>
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Show Skipped:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="general.showSkipped"
                            control={control}
                            defaultValue="N"
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" id="showSkipped-all" label="All" value='Y' checked={field.value=='Y'}/>
                                    <Form.Check {...field} inline type="radio" id="showSkipped-admin" label="Admin Only" value='A' checked={field.value=='A'}/>
                                    <Form.Check {...field} inline type="radio" id="showSkipped-none" label="None" value='N' checked={field.value=='N'}/>
                                    <Form.Text id="showSkippedHelp" muted>Toggle display of skipped hierarchy groups</Form.Text>
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
            </section>
            <SettingsWorkflowLabels/>
        </>
    );
}

function SettingsWorkflowLabels() {
    const { control } = useFormContext();
    const { general } = useSettingsContext();
    return (
        <section>
            <Row as="header" className="mt-3">
                <Col as="h4">Workflow Status Labels</Col>
            </Row>
            <Form.Group as={Row} controlId="awaitingStatusLabel">
                <Form.Label column md={2}>Awaiting Label:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name='general.awaitLabel'
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Label"/>}
                    />
                </Col>
            </Form.Group>
            <Table striped bordered>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Badge</th>
                        <th>List</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(general.status).map(k=>(
                        <tr key={k}>
                            <td className="align-middle">{k}</td>
                            {['badge','list'].map(s=>(
                                <td key={`${k}-${s}`}>
                                    <Controller
                                        name={`general.status.${k}.${s}`}
                                        control={control}
                                        defaultValue={general.status[k][s]}
                                        render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Label"/>}
                                    />
                                </td>
                            ))}
                       </tr>
                    ))}
                </tbody>
            </Table>
        </section>
    );
}