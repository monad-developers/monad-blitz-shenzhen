const SHORTZY_ABI = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "user",
                type: "address"
            },
            {
                indexed: true,
                internalType: "address",
                name: "token",
                type: "address"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "tokenAmount",
                type: "uint256"
            },
            {
                indexed: false,
                internalType: "int256",
                name: "pnl",
                type: "int256"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "endTime",
                type: "uint256"
            }
        ],
        name: "MemeShortClosed",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "user",
                type: "address"
            },
            {
                indexed: true,
                internalType: "address",
                name: "token",
                type: "address"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "tokenAmount",
                type: "uint256"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "entryPrice",
                type: "uint256"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "timestamp",
                type: "uint256"
            }
        ],
        name: "MemeShorted",
        type: "event"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token",
                type: "address"
            },
            {
                internalType: "int256",
                name: "pnl",
                type: "int256"
            }
        ],
        name: "closeShort",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token",
                type: "address"
            }
        ],
        name: "getTokenTotalShorted",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "user",
                type: "address"
            }
        ],
        name: "getUserShorts",
        outputs: [
            {
                components: [
                    {
                        internalType: "address",
                        name: "token",
                        type: "address"
                    },
                    {
                        internalType: "uint256",
                        name: "tokenAmount",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "entryPrice",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "startTime",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "endTime",
                        type: "uint256"
                    },
                    {
                        internalType: "int256",
                        name: "pnl",
                        type: "int256"
                    }
                ],
                internalType: "struct Shortzy.ShortRecord[]",
                name: "",
                type: "tuple[]"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "user",
                type: "address"
            }
        ],
        name: "getUserTotalPnL",
        outputs: [
            {
                internalType: "int256",
                name: "",
                type: "int256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            },
            {
                internalType: "address",
                name: "",
                type: "address"
            }
        ],
        name: "isShorting",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "tokenAmount",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "entryPrice",
                type: "uint256"
            }
        ],
        name: "short",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        name: "shortingUsers",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            }
        ],
        name: "totalShortedAmount",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            }
        ],
        name: "totalUserPnL",
        outputs: [
            {
                internalType: "int256",
                name: "",
                type: "int256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        name: "userShortHistory",
        outputs: [
            {
                internalType: "address",
                name: "token",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "tokenAmount",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "entryPrice",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "startTime",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "endTime",
                type: "uint256"
            },
            {
                internalType: "int256",
                name: "pnl",
                type: "int256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    // 在这里添加新的getShortingUsersCount函数
    {
        inputs: [],  // 无输入参数
        name: "getShortingUsersCount",  // 函数名
        outputs: [{  // 输出参数
            internalType: "uint256",  // 返回类型是uint256
            name: "",  // 无特定名称
            type: "uint256"  // 返回类型再次声明(在ABI中有时会重复)
        }],
        stateMutability: "view",  // 只读函数
        type: "function"  // 函数类型
    }
];

export default SHORTZY_ABI;