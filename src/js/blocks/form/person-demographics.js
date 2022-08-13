import React from "react";
import { useAppQueries } from "../../queries";
import { useFormContext, Controller } from "react-hook-form";
import { Row, Col, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";

export default function PersonDemographics() {
    const { control, setValue } = useFormContext();

    const {getListData} = useAppQueries();
    const gender = getListData('gender');
    const milstatus = getListData('militaryStatus');

    const handleChangeGender = (e,field) => {
        field.onChange(e);
        setValue('person.demographics.gender.value',(e.target.value)?gender.data.find(g=>g[0]==e.target.value)[1]:'');
    }
    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Demographics</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Date of Birth:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="person.demographics.DOB"
                        control={control}
                        render={({field}) => <Form.Control 
                            as={DatePicker} 
                            name={field.name}
                            selected={field.value} 
                            closeOnScroll={true} 
                            onChange={field.onChange} 
                        />}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Gender:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="person.demographics.gender.id"
                        control={control}
                        render={({field})=>(
                        <Form.Control {...field} as="select" onChange={e=>handleChangeGender(e,field)}>
                            <option></option>
                            {gender.data && gender.data.map(k=><option key={k[0]} value={k[0]}>{k[1]}</option>)}
                        </Form.Control>)}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>US Citizen:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="person.demographics.citizen"
                        defaultValue="Yes"
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
                <Form.Label column md={2}>Veteran:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="person.demographics.veteran"
                        defaultValue="Yes"
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
                <Form.Label column md={2}>Military Status:</Form.Label>
                <Col xs="auto">
                    {milstatus.isLoading && <p>loading...</p>}
                    {milstatus.isError && <p>error</p>}
                    {milstatus.data && 
                    <Controller
                        name="person.demographics.military_status"
                        defaultValue="Yes"
                        control={control}
                        render={({field}) => milstatus.data.map(s=><Form.Check key={s[0]} {...field} type="checkbox" label={s[1]} value={s[0]}/>)}
                    />}
                </Col>
            </Form.Group>
        </article>
    );
}