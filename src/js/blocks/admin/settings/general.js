import React from "react";
import { Form, Row, Col, Table } from "react-bootstrap";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { useSettingsContext } from "../../../app";

export default function SettingsGeneral() {
    const {control,formState:{errors}} = useFormContext();
    const watchHideNews = useWatch({name:'general.hideNews'});
    return (
        <>
            <section>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Allow Hide News:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="general.hideNews"
                            control={control}
                            defaultValue="Y"
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="checkbox" checked={field.value} onChange={e=>field.onChange(e.target.checked)}/>
                                    <Form.Text id="hideNewsHelp" muted>Allow users to hide news on home page.  Updating news content will show news again.</Form.Text>
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Hide News Expire:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="general.hideNewsExpire"
                            control={control}
                            defaultValue={24}
                            render={({field}) => (
                                <>
                                    <Form.Control {...field} type="number" disabled={!watchHideNews}/>
                                    <Form.Text id="hideNewsExpireHelp" muted>Amount of time (in hours) before the news will be displayed to the user after hiding (0 = no expiration)</Form.Text>
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Draft Limit:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="general.draftLimit"
                            control={control}
                            defaultValue={10}
                            rules={{
                                min:{value:0,message:'Limit cannot be less than 0'},
                                max:{value:100,message:'Limit cannot be greater than 100'}
                            }}
                            render={({field}) => (
                                <>
                                    <Form.Control {...field} type="number" isInvalid={errors?.general?.draftLimit}/>
                                    <Form.Text id="draftLimitHelp" muted>Maximum number of drafts a user may have (0 = No Limit)</Form.Text>
                                </>
                            )}
                        />
                        <Form.Control.Feedback type="invalid">{errors?.general?.draftLimit?.message}</Form.Control.Feedback>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Show Request Workflow:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="general.showReqWF"
                            control={control}
                            defaultValue="a"
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" id="showSkipped-all" label="All" value='y' checked={field.value=='y'}/>
                                    <Form.Check {...field} inline type="radio" id="showSkipped-admin" label="Admin Only" value='a' checked={field.value=='a'}/>
                                    <Form.Check {...field} inline type="radio" id="showSkipped-none" label="None" value='n' checked={field.value=='n'}/>
                                    <Form.Text id="showReqWFHelp" muted>Toggle display of workflow on Requests lists</Form.Text>
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Show Form Workflow:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="general.showFormWF"
                            control={control}
                            defaultValue="a"
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" id="showSkipped-all" label="All" value='y' checked={field.value=='y'}/>
                                    <Form.Check {...field} inline type="radio" id="showSkipped-admin" label="Admin Only" value='a' checked={field.value=='a'}/>
                                    <Form.Check {...field} inline type="radio" id="showSkipped-none" label="None" value='n' checked={field.value=='n'}/>
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
                            defaultValue="n"
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" id="showSkipped-all" label="All" value='y' checked={field.value=='y'}/>
                                    <Form.Check {...field} inline type="radio" id="showSkipped-admin" label="Admin Only" value='a' checked={field.value=='a'}/>
                                    <Form.Check {...field} inline type="radio" id="showSkipped-none" label="None" value='n' checked={field.value=='n'}/>
                                    <Form.Text id="showSkippedHelp" muted>Toggle display of skipped hierarchy groups</Form.Text>
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
            </section>
            <SettingsGeneralLabels/>
        </>
    );
}

function SettingsGeneralLabels() {
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