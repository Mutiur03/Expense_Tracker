"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CURRENCIES, getCurrencyByCode, DEFAULT_CURRENCY } from "../lib/currency";
import { useEffect, useState } from "react";
import { DataService } from "../lib/data-service";
import { useTransactions } from "../hooks/use-transactions";

interface CurrencySelectorProps {
    currentCurrency: { code: string; symbol: string; name: string };
    onCurrencyChange?: (currencyCode: string) => void;
}
export function CurrencySelector({ currentCurrency, onCurrencyChange }: CurrencySelectorProps) {





    return (
        <Select
            value={currentCurrency.code}
            onValueChange={onCurrencyChange}
        >
            <SelectTrigger className="w-28">
                <SelectValue>
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{currentCurrency.symbol}</span>
                        <span>{currentCurrency.code}</span>
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{curr.symbol}</span>
                            <span>{curr.code} - {curr.name}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
