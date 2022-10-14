import React from "react";
import { useAppQueries } from "../../queries";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { Loading } from "../components";

const name = 'person.info';

export default function PersonInfo() {
    const { control, setValue } = useFormContext();

    const watchRehireRetiree = useWatch({name:`${name}.rehireRetiree`});

    const {getListData} = useAppQueries();
    const salutations = getListData('salutations');

    const handleRehireRetireeChange = (e,field) => {
        field.onChange(e);
        console.log(e.target.value);
        if (e.target.value == 'No') {
            ['retiredDate','retiredFrom'].forEach(f=>setValue(`${name}.${f}`,''));
        }
    }

    return (
        <>
            <article className="mt-3">
                <Row as="header">
                    <Col as="h3">Identification</Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>SUNY ID:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name={`${name}.sunyId`}
                            control={control}
                            render={({field})=><Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>B-Number:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name={`${name}.bNumber`}
                            control={control}
                            render={({field})=><Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
            </article>
            <article className="mt-3">
                <Row as="header">
                    <Col as="h3">Name</Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Salutation:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name={`${name}.salutation`}
                            control={control}
                            render={({field})=>(
                                <>
                                    {salutations.isLoading && <div className="pt-2"><Loading>Loading Data</Loading></div>}
                                    {salutations.isError && <div className="pt-2"><Loading isError>Failed to Load</Loading></div>}
                                    {salutations.data &&
                                        <Form.Control {...field} as="select">
                                            <option></option>
                                            {salutations.data.map(s=><option key={s[0]} value={s[0]}>{s[1]}</option>)}
                                        </Form.Control>
                                    }
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>First Name:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name={`${name}.firstName`}
                            control={control}
                            render={({field})=><Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Middle Name:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name={`${name}.middleName`}
                            control={control}
                            render={({field})=><Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Last Name:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name={`${name}.lastName`}
                            control={control}
                            render={({field})=><Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Suffix:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name={`${name}.suffix`}
                            control={control}
                            render={({field})=><Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
            </article>
            <article className="mt-3">
                <Row as="header">
                    <Col as="h3">Additional Information</Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Volunteer Firefighter/EMT:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name={`${name}.volFFEMT`}
                            defaultValue="No"
                            control={control}
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" label="Yes" value='Yes' checked={field.value=='Yes'}/>
                                    <Form.Check {...field} inline type="radio" label="No" value='No' checked={field.value=='No'}/>
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Rehire Retiree:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name={`${name}.rehireRetiree`}
                            defaultValue="No"
                            control={control}
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" label="Yes" value='Yes' checked={field.value=='Yes'} onChange={e=>handleRehireRetireeChange(e,field)}/>
                                    <Form.Check {...field} inline type="radio" label="No" value='No' checked={field.value=='No'} onChange={e=>handleRehireRetireeChange(e,field)}/>
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
                {watchRehireRetiree=='Yes' &&
                    <>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>Retired Date:</Form.Label>
                            <Col xs="auto">
                                <InputGroup>
                                    <Controller
                                        name={`${name}.retiredDate`}
                                        defaultValue=""
                                        control={control}
                                        render={({field}) => <Form.Control
                                            as={DatePicker}
                                            name={field.name}
                                            closeOnScroll={true}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            autoComplete="off"
                                        />}
                                    />
                                    <InputGroup.Append>
                                        <InputGroup.Text>
                                            <Icon icon="mdi:calendar-blank"/>
                                        </InputGroup.Text>
                                    </InputGroup.Append>
                                </InputGroup>
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>Retired From:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.retiredFrom`}
                                    control={control}
                                    render={({field})=><Form.Control {...field} type="text"/>}
                                />
                            </Col>
                        </Form.Group>
                    </>
                }
            </article>
        </>
    );
}