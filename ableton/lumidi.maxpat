{
	"patcher": {
		"fileversion": 1,
		"appversion": {
			"major": 8,
			"minor": 5,
			"revision": 5,
			"architecture": "x64",
			"modernui": 1
		},
		"classnamespace": "box",
		"rect": [
			59.0,
			106.0,
			1220.0,
			480.0
		],
		"bglocked": 0,
		"openinpresentation": 1,
		"default_fontsize": 12.0,
		"default_fontface": 0,
		"default_fontname": "Arial",
		"gridonopen": 1,
		"gridsize": [
			15.0,
			15.0
		],
		"gridsnaponopen": 1,
		"objectsnaponopen": 1,
		"statusbarvisible": 2,
		"toolbarvisible": 1,
		"boxes": [
			{
				"box": {
					"id": "obj-1",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 3,
					"outlettype": [
						"bang",
						"int",
						"int"
					],
					"patching_rect": [
						30.0,
						30.0,
						100.0,
						22.0
					],
					"text": "live.thisdevice"
				}
			},
			{
				"box": {
					"id": "obj-2",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						"int"
					],
					"patching_rect": [
						30.0,
						70.0,
						32.0,
						22.0
					],
					"text": "t 1"
				}
			},
			{
				"box": {
					"id": "obj-3",
					"maxclass": "newobj",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						"bang"
					],
					"patching_rect": [
						30.0,
						110.0,
						62.0,
						22.0
					],
					"text": "metro 33"
				}
			},
			{
				"box": {
					"id": "obj-4",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"bang",
						"bang"
					],
					"patching_rect": [
						30.0,
						150.0,
						50.0,
						22.0
					],
					"text": "t b b"
				}
			},
			{
				"box": {
					"id": "obj-5",
					"maxclass": "newobj",
					"numinlets": 2,
					"numoutlets": 9,
					"outlettype": [
						"int",
						"int",
						"float",
						"float",
						"float",
						"",
						"int",
						"float",
						""
					],
					"patching_rect": [
						120.0,
						190.0,
						150.0,
						22.0
					],
					"text": "transport"
				}
			},
			{
				"box": {
					"id": "obj-6",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						120.0,
						230.0,
						92.0,
						22.0
					],
					"text": "prepend tempo"
				}
			},
			{
				"box": {
					"id": "obj-7",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						225.0,
						230.0,
						100.0,
						22.0
					],
					"text": "prepend playing"
				}
			},
			{
				"box": {
					"id": "obj-8",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						338.0,
						230.0,
						87.0,
						22.0
					],
					"text": "prepend ticks"
				}
			},
			{
				"box": {
					"id": "obj-10",
					"maxclass": "live.menu",
					"numinlets": 1,
					"numoutlets": 3,
					"outlettype": [
						"",
						"",
						"float"
					],
					"parameter_enable": 1,
					"patching_rect": [
						450.0,
						30.0,
						180.0,
						20.0
					],
					"presentation": 1,
					"presentation_rect": [
						90.0,
						6.0,
						175.0,
						18.0
					],
					"saved_attribute_attributes": {
						"valueof": {
							"parameter_enum": [
								"Solid",
								"Pulse",
								"Chase",
								"Rainbow",
								"Strobe",
								"Scanner",
								"Breathe",
								"Wipe",
								"Theater",
								"Burst",
								"Hue Drift",
								"Sparkle",
								"Fire",
								"Flip",
								"Wave"
							],
							"parameter_initial": [
								0
							],
							"parameter_initial_enable": 1,
							"parameter_longname": "Animation",
							"parameter_mmax": 14,
							"parameter_shortname": "Anim",
							"parameter_type": 2
						}
					}
				}
			},
			{
				"box": {
					"id": "obj-11",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						450.0,
						100.0,
						85.0,
						22.0
					],
					"text": "prepend anim"
				}
			},
			{
				"box": {
					"id": "obj-12",
					"maxclass": "live.dial",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"float"
					],
					"parameter_enable": 1,
					"patching_rect": [
						650.0,
						30.0,
						41.0,
						48.0
					],
					"presentation": 1,
					"presentation_rect": [
						8.0,
						36.0,
						41.0,
						48.0
					],
					"saved_attribute_attributes": {
						"valueof": {
							"parameter_initial": [
								0.0
							],
							"parameter_initial_enable": 1,
							"parameter_longname": "Hue",
							"parameter_mmax": 360.0,
							"parameter_mmin": 0.0,
							"parameter_shortname": "Hue",
							"parameter_type": 0
						}
					}
				}
			},
			{
				"box": {
					"id": "obj-13",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						650.0,
						100.0,
						80.0,
						22.0
					],
					"text": "prepend hue"
				}
			},
			{
				"box": {
					"id": "obj-14",
					"maxclass": "live.dial",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"float"
					],
					"parameter_enable": 1,
					"patching_rect": [
						750.0,
						30.0,
						41.0,
						48.0
					],
					"presentation": 1,
					"presentation_rect": [
						58.0,
						36.0,
						41.0,
						48.0
					],
					"saved_attribute_attributes": {
						"valueof": {
							"parameter_initial": [
								100.0
							],
							"parameter_initial_enable": 1,
							"parameter_longname": "Saturation",
							"parameter_mmax": 100.0,
							"parameter_mmin": 0.0,
							"parameter_shortname": "Sat",
							"parameter_type": 0
						}
					}
				}
			},
			{
				"box": {
					"id": "obj-15",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						750.0,
						100.0,
						76.0,
						22.0
					],
					"text": "prepend sat"
				}
			},
			{
				"box": {
					"id": "obj-16",
					"maxclass": "live.dial",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"float"
					],
					"parameter_enable": 1,
					"patching_rect": [
						850.0,
						30.0,
						41.0,
						48.0
					],
					"presentation": 1,
					"presentation_rect": [
						108.0,
						36.0,
						41.0,
						48.0
					],
					"saved_attribute_attributes": {
						"valueof": {
							"parameter_initial": [
								80.0
							],
							"parameter_initial_enable": 1,
							"parameter_longname": "Brightness",
							"parameter_mmax": 100.0,
							"parameter_mmin": 0.0,
							"parameter_shortname": "Bright",
							"parameter_type": 0
						}
					}
				}
			},
			{
				"box": {
					"id": "obj-17",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						850.0,
						100.0,
						118.0,
						22.0
					],
					"text": "prepend brightness"
				}
			},
			{
				"box": {
					"id": "obj-18",
					"maxclass": "live.dial",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"float"
					],
					"parameter_enable": 1,
					"patching_rect": [
						990.0,
						30.0,
						41.0,
						48.0
					],
					"presentation": 1,
					"presentation_rect": [
						158.0,
						36.0,
						41.0,
						48.0
					],
					"saved_attribute_attributes": {
						"valueof": {
							"parameter_exponent": 3.0,
							"parameter_initial": [
								1.0
							],
							"parameter_initial_enable": 1,
							"parameter_longname": "Rate",
							"parameter_mmax": 8.0,
							"parameter_mmin": 0.05,
							"parameter_shortname": "Rate",
							"parameter_type": 0
						}
					}
				}
			},
			{
				"box": {
					"id": "obj-19",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						990.0,
						100.0,
						80.0,
						22.0
					],
					"text": "prepend rate"
				}
			},
			{
				"box": {
					"id": "obj-20",
					"maxclass": "live.toggle",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"parameter_enable": 1,
					"patching_rect": [
						1090.0,
						30.0,
						15.0,
						15.0
					],
					"presentation": 1,
					"presentation_rect": [
						216.0,
						52.0,
						15.0,
						15.0
					],
					"saved_attribute_attributes": {
						"valueof": {
							"parameter_enum": [
								"off",
								"on"
							],
							"parameter_initial": [
								1
							],
							"parameter_initial_enable": 1,
							"parameter_longname": "Sync",
							"parameter_mmax": 1,
							"parameter_shortname": "Sync",
							"parameter_type": 2
						}
					}
				}
			},
			{
				"box": {
					"id": "obj-21",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						1090.0,
						100.0,
						83.0,
						22.0
					],
					"text": "prepend sync"
				}
			},
			{
				"box": {
					"id": "obj-22",
					"maxclass": "live.menu",
					"numinlets": 1,
					"numoutlets": 3,
					"outlettype": [
						"",
						"",
						"float"
					],
					"parameter_enable": 1,
					"patching_rect": [
						1130.0,
						30.0,
						100.0,
						15.0
					],
					"presentation": 1,
					"presentation_rect": [
						275.0,
						52.0,
						70.0,
						15.0
					],
					"saved_attribute_attributes": {
						"valueof": {
							"parameter_enum": [
								"8 bars",
								"4 bars",
								"2 bars",
								"1 bar",
								"1/2",
								"1/4",
								"1/8",
								"1/16"
							],
							"parameter_initial": [
								3
							],
							"parameter_initial_enable": 1,
							"parameter_longname": "Sync Rate",
							"parameter_mmax": 7,
							"parameter_shortname": "SyncRate",
							"parameter_type": 2
						}
					}
				}
			},
			{
				"box": {
					"id": "obj-23",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						1130.0,
						100.0,
						105.0,
						22.0
					],
					"text": "prepend syncrate"
				}
			},
			{
				"box": {
					"id": "obj-24",
					"maxclass": "live.tab",
					"numinlets": 1,
					"numoutlets": 3,
					"outlettype": [
						"",
						"",
						"float"
					],
					"parameter_enable": 1,
					"patching_rect": [
						450.0,
						160.0,
						70.0,
						20.0
					],
					"presentation": 1,
					"presentation_rect": [
						272.0,
						6.0,
						72.0,
						18.0
					],
					"saved_attribute_attributes": {
						"valueof": {
							"parameter_enum": [
								"Fwd",
								"Rev"
							],
							"parameter_initial": [
								0
							],
							"parameter_initial_enable": 1,
							"parameter_longname": "Direction",
							"parameter_mmax": 1,
							"parameter_shortname": "Dir",
							"parameter_type": 2
						}
					}
				}
			},
			{
				"box": {
					"id": "obj-25",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						450.0,
						200.0,
						75.0,
						22.0
					],
					"text": "prepend dir"
				}
			},
			{
				"box": {
					"id": "obj-26",
					"maxclass": "live.toggle",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"parameter_enable": 1,
					"patching_rect": [
						560.0,
						160.0,
						15.0,
						15.0
					],
					"presentation": 1,
					"presentation_rect": [
						38.0,
						10.0,
						15.0,
						15.0
					],
					"saved_attribute_attributes": {
						"valueof": {
							"parameter_enum": [
								"off",
								"on"
							],
							"parameter_initial": [
								1
							],
							"parameter_initial_enable": 1,
							"parameter_longname": "On",
							"parameter_mmax": 1,
							"parameter_shortname": "On",
							"parameter_type": 2
						}
					}
				}
			},
			{
				"box": {
					"id": "obj-27",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						560.0,
						200.0,
						74.0,
						22.0
					],
					"text": "prepend on"
				}
			},
			{
				"box": {
					"id": "obj-30",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 4,
					"outlettype": [
						"",
						"",
						"",
						""
					],
					"patching_rect": [
						30.0,
						300.0,
						140.0,
						22.0
					],
					"text": "js lumidi-engine.js"
				}
			},
			{
				"box": {
					"id": "obj-31",
					"maxclass": "newobj",
					"numinlets": 7,
					"numoutlets": 2,
					"outlettype": [
						"int",
						""
					],
					"patching_rect": [
						30.0,
						350.0,
						100.0,
						22.0
					],
					"text": "midiformat"
				}
			},
			{
				"box": {
					"id": "obj-32",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						30.0,
						400.0,
						60.0,
						22.0
					],
					"text": "midiout"
				}
			},
			{
				"box": {
					"id": "obj-33",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						"int"
					],
					"patching_rect": [
						150.0,
						350.0,
						60.0,
						22.0
					],
					"text": "midiin"
				}
			},
			{
				"box": {
					"id": "obj-34",
					"maxclass": "swatch",
					"numinlets": 3,
					"numoutlets": 2,
					"outlettype": [
						"",
						"float"
					],
					"parameter_enable": 0,
					"patching_rect": [
						210.0,
						300.0,
						48.0,
						48.0
					],
					"presentation": 1,
					"presentation_rect": [
						355.0,
						6.0,
						48.0,
						48.0
					]
				}
			},
			{
				"box": {
					"id": "obj-35",
					"maxclass": "comment",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						585.0,
						158.0,
						30.0,
						18.0
					],
					"presentation": 1,
					"presentation_rect": [
						55.0,
						9.0,
						32.0,
						18.0
					],
					"text": "On"
				}
			},
			{
				"box": {
					"id": "obj-36",
					"maxclass": "comment",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						1110.0,
						28.0,
						40.0,
						18.0
					],
					"presentation": 1,
					"presentation_rect": [
						233.0,
						51.0,
						40.0,
						18.0
					],
					"text": "Sync"
				}
			},
			{
				"box": {
					"id": "obj-37",
					"maxclass": "fpic",
					"autofit": 1,
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						"jit_matrix"
					],
					"patching_rect": [
						280.0,
						300.0,
						40.0,
						40.0
					],
					"pic": "lumidi-logo.svg",
					"presentation": 1,
					"presentation_rect": [
						6.0,
						5.0,
						26.0,
						26.0
					]
				}
			},
			{
				"box": {
					"id": "obj-38",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						150.0,
						70.0,
						92.0,
						22.0
					],
					"text": "prepend active"
				}
			},
			{
				"box": {
					"id": "obj-40",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 5,
					"outlettype": [
						"",
						"",
						"",
						"",
						""
					],
					"patching_rect": [
						30.0,
						390.0,
						180.0,
						22.0
					],
					"text": "route alive sent gate resync"
				}
			},
			{
				"box": {
					"id": "obj-41",
					"maxclass": "number",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"patching_rect": [
						30.0,
						430.0,
						60.0,
						22.0
					]
				}
			},
			{
				"box": {
					"id": "obj-42",
					"maxclass": "number",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"bang"
					],
					"patching_rect": [
						100.0,
						430.0,
						60.0,
						22.0
					]
				}
			},
			{
				"box": {
					"id": "obj-44",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						170.0,
						430.0,
						75.0,
						22.0
					],
					"text": "prepend set"
				}
			},
			{
				"box": {
					"id": "obj-43",
					"maxclass": "message",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						170.0,
						470.0,
						100.0,
						22.0
					],
					"text": "starting"
				}
			},
			{
				"box": {
					"id": "obj-45",
					"maxclass": "comment",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						280.0,
						470.0,
						60.0,
						18.0
					],
					"text": "debug"
				}
			},
			{
				"box": {
					"id": "obj-46",
					"maxclass": "message",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						230.0,
						430.0,
						80.0,
						22.0
					],
					"text": "outputvalue"
				}
			},
			{
				"box": {
					"id": "obj-47",
					"maxclass": "jsui",
					"filename": "lumidi-preview.js",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						30.0,
						470.0,
						396.0,
						26.0
					],
					"presentation": 1,
					"presentation_rect": [
						8.0,
						90.0,
						396.0,
						26.0
					]
				}
			},
			{
				"box": {
					"id": "obj-48",
					"maxclass": "live.numbox",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"float"
					],
					"parameter_enable": 1,
					"patching_rect": [
						1250.0,
						30.0,
						50.0,
						22.0
					],
					"presentation": 1,
					"presentation_rect": [
						252.0,
						28.0,
						32.0,
						15.0
					],
					"saved_attribute_attributes": {
						"valueof": {
							"parameter_initial": [
								1
							],
							"parameter_initial_enable": 1,
							"parameter_longname": "Strip Number",
							"parameter_mmax": 16,
							"parameter_mmin": 1,
							"parameter_shortname": "Strip",
							"parameter_type": 1
						}
					}
				}
			},
			{
				"box": {
					"id": "obj-49",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						1250.0,
						100.0,
						90.0,
						22.0
					],
					"text": "prepend strip"
				}
			},
			{
				"box": {
					"id": "obj-50",
					"maxclass": "live.numbox",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": [
						"",
						"float"
					],
					"parameter_enable": 1,
					"patching_rect": [
						1340.0,
						30.0,
						50.0,
						22.0
					],
					"presentation": 1,
					"presentation_rect": [
						306.0,
						28.0,
						32.0,
						15.0
					],
					"saved_attribute_attributes": {
						"valueof": {
							"parameter_initial": [
								1
							],
							"parameter_initial_enable": 1,
							"parameter_longname": "Strip Count",
							"parameter_mmax": 16,
							"parameter_mmin": 1,
							"parameter_shortname": "Of",
							"parameter_type": 1
						}
					}
				}
			},
			{
				"box": {
					"id": "obj-51",
					"maxclass": "newobj",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": [
						""
					],
					"patching_rect": [
						1340.0,
						100.0,
						90.0,
						22.0
					],
					"text": "prepend strips"
				}
			},
			{
				"box": {
					"id": "obj-52",
					"maxclass": "comment",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						1250.0,
						140.0,
						60.0,
						18.0
					],
					"presentation": 1,
					"presentation_rect": [
						216.0,
						29.0,
						34.0,
						15.0
					],
					"text": "strip"
				}
			},
			{
				"box": {
					"id": "obj-53",
					"maxclass": "comment",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [
						1340.0,
						140.0,
						60.0,
						18.0
					],
					"presentation": 1,
					"presentation_rect": [
						288.0,
						29.0,
						16.0,
						15.0
					],
					"text": "of"
				}
			}
		],
		"lines": [
			{
				"patchline": {
					"source": [
						"obj-1",
						0
					],
					"destination": [
						"obj-2",
						0
					]
				}
			},{
				"patchline": {
					"source": [
						"obj-30",
						3
					],
					"destination": [
						"obj-47",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-2",
						0
					],
					"destination": [
						"obj-3",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-3",
						0
					],
					"destination": [
						"obj-4",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-4",
						1
					],
					"destination": [
						"obj-5",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-4",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-5",
						4
					],
					"destination": [
						"obj-6",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-5",
						6
					],
					"destination": [
						"obj-7",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-5",
						7
					],
					"destination": [
						"obj-8",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-6",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-7",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-8",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-10",
						0
					],
					"destination": [
						"obj-11",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-11",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-12",
						0
					],
					"destination": [
						"obj-13",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-13",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-14",
						0
					],
					"destination": [
						"obj-15",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-15",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-16",
						0
					],
					"destination": [
						"obj-17",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-17",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-18",
						0
					],
					"destination": [
						"obj-19",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-19",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-20",
						0
					],
					"destination": [
						"obj-21",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-21",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-22",
						0
					],
					"destination": [
						"obj-23",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-23",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-24",
						0
					],
					"destination": [
						"obj-25",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-25",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-26",
						0
					],
					"destination": [
						"obj-27",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-27",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-30",
						0
					],
					"destination": [
						"obj-31",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-31",
						0
					],
					"destination": [
						"obj-32",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-33",
						0
					],
					"destination": [
						"obj-32",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-30",
						1
					],
					"destination": [
						"obj-34",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-1",
						1
					],
					"destination": [
						"obj-38",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-38",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-40",
						0
					],
					"source": [
						"obj-30",
						2
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-41",
						0
					],
					"source": [
						"obj-40",
						0
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-42",
						0
					],
					"source": [
						"obj-40",
						1
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-44",
						0
					],
					"source": [
						"obj-40",
						2
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-43",
						0
					],
					"source": [
						"obj-44",
						0
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-46",
						0
					],
					"source": [
						"obj-40",
						3
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-10",
						0
					],
					"source": [
						"obj-46",
						0
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-12",
						0
					],
					"source": [
						"obj-46",
						0
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-14",
						0
					],
					"source": [
						"obj-46",
						0
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-16",
						0
					],
					"source": [
						"obj-46",
						0
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-18",
						0
					],
					"source": [
						"obj-46",
						0
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-20",
						0
					],
					"source": [
						"obj-46",
						0
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-22",
						0
					],
					"source": [
						"obj-46",
						0
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-24",
						0
					],
					"source": [
						"obj-46",
						0
					]
				}
			},
			{
				"patchline": {
					"destination": [
						"obj-26",
						0
					],
					"source": [
						"obj-46",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-48",
						0
					],
					"destination": [
						"obj-49",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-49",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-50",
						0
					],
					"destination": [
						"obj-51",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-51",
						0
					],
					"destination": [
						"obj-30",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-46",
						0
					],
					"destination": [
						"obj-48",
						0
					]
				}
			},
			{
				"patchline": {
					"source": [
						"obj-46",
						0
					],
					"destination": [
						"obj-50",
						0
					]
				}
			}
		],
		"dependency_cache": [],
		"autosave": 0
	}
}
