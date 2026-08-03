"use client"
import React, {useEffect, useState} from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";

export const TREATMENT_OPTIONS = [
    {value: 'prevention', label: 'Qarşısının alınması'},
    {value: 'mitigation', label: 'Təsirin azaldılması'},
    {value: 'transfer', label: 'Ötürülmə'},
    {value: 'acceptance', label: 'Qəbul'},
];

export const RISK_LEVEL_META = {
    critical: {label: 'Kritik', color: '#D32F2F'},
    high: {label: 'Yüksək', color: '#ED6C02'},
    medium: {label: 'Orta', color: '#C9A227'},
    low: {label: 'Aşağı', color: '#2E7D32'},
};

export function computeRiskLevel(h, m, n) {
    const degree = (Number(h) || 0) * (Number(m) || 0) * (Number(n) || 0);
    let level = 'low';
    if (degree >= 60) level = 'critical';
    else if (degree >= 30) level = 'high';
    else if (degree >= 12) level = 'medium';
    return {degree, level};
}

const EMPTY_FORM = {
    designation: '',
    legal_basis: '',
    international_framework: '',
    national_legal_reference: '',
    asset_value: 1,
    probability: 1,
    impact: 1,
    treatment_option: 'mitigation',
    residual_risk: '',
    update_frequency: '',
    incident_notification_notes: '',
    standard_references: '',
    inventory_id: null,
};

export default function RiskFormDialog({open, onClose, onSubmit, initialData, loading}) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});

    const [inventoryValue, setInventoryValue] = useState(null);
    const [inventoryOptions, setInventoryOptions] = useState([]);
    const [inventoryInput, setInventoryInput] = useState('');
    const [inventoryLoading, setInventoryLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(initialData ? {...EMPTY_FORM, ...initialData, inventory_id: initialData.inventory?.id ?? null} : EMPTY_FORM);
            setInventoryValue(initialData?.inventory || null);
            setInventoryInput('');
            setErrors({});
        }
    }, [open, initialData]);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(async () => {
            setInventoryLoading(true);
            try {
                const res = await service_api.get(`${NEXT_API_ENDPOINTS.INVENTORY.LIST}?search=${encodeURIComponent(inventoryInput)}&page_size=20`);
                setInventoryOptions(res.data?.results || []);
            } catch (e) { /* səssiz */ } finally {
                setInventoryLoading(false);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [inventoryInput, open]);

    const handleChange = (field) => (e) => {
        setForm((f) => ({...f, [field]: e.target.value}));
    };

    const {degree, level} = computeRiskLevel(form.asset_value, form.probability, form.impact);
    const levelMeta = RISK_LEVEL_META[level];

    function validate() {
        const e = {};
        if (!form.designation?.trim()) e.designation = 'Təyinat boş ola bilməz';
        [['asset_value', 'Aktivin dəyəri'], ['probability', 'Ehtimal'], ['impact', 'Təsir']].forEach(([k, label]) => {
            const v = Number(form[k]);
            if (!v || v < 1 || v > 5) e[k] = `${label} 1-5 arasında olmalıdır`;
        });
        if (!form.inventory_id) e.inventory_id = 'Əlaqəli inventar seçilməlidir';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleSave() {
        if (!validate()) return;
        const {inventory, ...payload} = form; // "inventory" obyektini göndərmirik, yalnız inventory_id
        onSubmit(payload);
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{initialData ? 'Riski redaktə et' : 'Yeni risk yarat'}</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2} sx={{mt: 0.5}}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth label="Təyinat" value={form.designation}
                            onChange={handleChange('designation')}
                            error={!!errors.designation} helperText={errors.designation}
                            disabled={loading}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Autocomplete
                            options={inventoryOptions}
                            loading={inventoryLoading}
                            value={inventoryValue}
                            getOptionLabel={(o) => o ? `${o.inventory_number} — ${o.product_name}` : ''}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            inputValue={inventoryInput}
                            onInputChange={(e, val) => setInventoryInput(val)}
                            onChange={(e, val) => {
                                setInventoryValue(val);
                                setForm((f) => ({...f, inventory_id: val?.id ?? null}));
                            }}
                            disabled={loading}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Əlaqəli inventar"
                                    error={!!errors.inventory_id}
                                    helperText={errors.inventory_id || 'İnventar nömrəsi və ya adı ilə axtarın'}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {inventoryLoading ? <CircularProgress color="inherit" size={16}/> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth multiline minRows={2} label="Hüquqi əsas"
                            value={form.legal_basis} onChange={handleChange('legal_basis')} disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth multiline minRows={2} label="Beynəlxalq çərçivələr / Çərçivə istinadı"
                            value={form.international_framework}
                            onChange={handleChange('international_framework')} disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth multiline minRows={2} label="Milli hüquqi istinad"
                            value={form.national_legal_reference}
                            onChange={handleChange('national_legal_reference')} disabled={loading}
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField
                            select fullWidth label="Aktivin dəyəri (H)" value={form.asset_value}
                            onChange={handleChange('asset_value')} error={!!errors.asset_value}
                            helperText={errors.asset_value} disabled={loading}
                        >
                            {[1, 2, 3, 4, 5].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            select fullWidth label="Ehtimal (M)" value={form.probability}
                            onChange={handleChange('probability')} error={!!errors.probability}
                            helperText={errors.probability} disabled={loading}
                        >
                            {[1, 2, 3, 4, 5].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            select fullWidth label="Təsir (N)" value={form.impact}
                            onChange={handleChange('impact')} error={!!errors.impact}
                            helperText={errors.impact} disabled={loading}
                        >
                            {[1, 2, 3, 4, 5].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </TextField>
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, backgroundColor: '#F7F7F9', borderRadius: 1}}>
                            <Typography sx={{fontSize: 14, fontWeight: 600}}>
                                Risk dərəcəsi (P): {degree} / 125
                            </Typography>
                            <Chip
                                label={levelMeta.label}
                                size="small"
                                sx={{backgroundColor: levelMeta.color, color: '#fff', fontWeight: 600}}
                            />
                        </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            select fullWidth label="Emal variantı (Q)" value={form.treatment_option}
                            onChange={handleChange('treatment_option')} disabled={loading}
                        >
                            {TREATMENT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth label="Yenilənmə tarixi/tezliyi" value={form.update_frequency}
                            onChange={handleChange('update_frequency')} disabled={loading}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth multiline minRows={2} label="Qalıq risk (T)"
                            value={form.residual_risk} onChange={handleChange('residual_risk')} disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth multiline minRows={2} label="İnsident bildirişi qeydləri"
                            value={form.incident_notification_notes}
                            onChange={handleChange('incident_notification_notes')} disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth multiline minRows={2} label="Standartlara istinadlar"
                            value={form.standard_references}
                            onChange={handleChange('standard_references')} disabled={loading}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{px: 3, py: 2}}>
                <Button onClick={onClose} disabled={loading}>İmtina</Button>
                <Button onClick={handleSave} variant="contained" disabled={loading}>
                    {initialData ? 'Yadda saxla' : 'Yarat'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}