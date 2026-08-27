"use client"
import React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {GOV} from "@/components/theme/govColors";

export default function AdminPanelBackLink() {
    return (
        <Link href="/inzibatci-paneli" style={{textDecoration: 'none'}}>
            <Box sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.75, mb: 2.5,
                color: GOV.textMuted, '&:hover': {color: GOV.navy},
            }}>
                <ArrowBackIcon sx={{fontSize: 16}}/>
                <Typography sx={{fontSize: 13.5, fontWeight: 500}}>İnzibatçı panelinə qayıt</Typography>
            </Box>
        </Link>
    );
}