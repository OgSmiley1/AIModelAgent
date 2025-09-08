
Attribute VB_Name = "WhatsAppParser"

' WhatsApp Parser Module for Vacheron Constantin Enhanced Sellout Plan
' This module contains VBA code to parse WhatsApp conversations and update the Client_Summary sheet

Option Explicit

' Main procedure triggered when text is pasted into cell B2 of WhatsApp_Parser sheet
Public Sub ParseWhatsAppConversation()
    Dim wsParser As Worksheet
    Dim wsSummary As Worksheet
    Dim conversation As String
    Dim clientID As String
    Dim clientName As String
    Dim archetype As String
    Dim language As String
    Dim sentiment As Double
    Dim interests As String
    Dim objections As String
    Dim lastRow As Long
    
    ' Set references to worksheets
    Set wsParser = ThisWorkbook.Sheets("WhatsApp_Parser")
    Set wsSummary = ThisWorkbook.Sheets("Client_Summary")
    
    ' Get the conversation text
    conversation = wsParser.Range("B2").Value
    
    ' Check if conversation is empty
    If Trim(conversation) = "" Or Trim(conversation) = "[Sample WhatsApp conversation will appear here when pasted]" Then
        MsgBox "Please paste a WhatsApp conversation in cell B2.", vbExclamation
        Exit Sub
    End If
    
    ' Analyze the conversation
    clientName = ExtractClientName(conversation)
    clientID = GenerateClientID(clientName)
    archetype = DetermineArchetype(conversation)
    language = DetectLanguage(conversation)
    sentiment = AnalyzeSentiment(conversation)
    interests = ExtractInterests(conversation)
    objections = ExtractObjections(conversation)
    
    ' Find the next empty row in Client_Summary
    lastRow = wsSummary.Cells(wsSummary.Rows.Count, "A").End(xlUp).Row + 1
    
    ' Update Client_Summary sheet
    wsSummary.Cells(lastRow, 1).Value = clientID                   ' Client ID
    wsSummary.Cells(lastRow, 2).Value = clientName                 ' Client Name
    wsSummary.Cells(lastRow, 3).Value = archetype                  ' Archetype
    wsSummary.Cells(lastRow, 4).Value = language                   ' Language Preference
    wsSummary.Cells(lastRow, 5).Value = sentiment                  ' Sentiment Score
    wsSummary.Cells(lastRow, 6).Value = Format(Now, "yyyy-mm-dd")  ' Sentiment History (date)
    wsSummary.Cells(lastRow, 7).Value = interests                  ' Key Interests
    wsSummary.Cells(lastRow, 8).Value = objections                 ' Objections
    wsSummary.Cells(lastRow, 9).Value = DetermineCommunicationStyle(conversation, language)  ' Communication Style
    wsSummary.Cells(lastRow, 10).Value = DetermineDecisionFactors(conversation)  ' Decision Factors
    wsSummary.Cells(lastRow, 11).Value = ""                        ' Influencers (blank for now)
    wsSummary.Cells(lastRow, 12).Value = Format(Now, "yyyy-mm-dd") ' Last Interaction
    wsSummary.Cells(lastRow, 13).Value = GenerateRecommendedApproach(archetype, sentiment)  ' Recommended Approach
    wsSummary.Cells(lastRow, 14).Value = "Auto-generated from WhatsApp conversation"  ' Notes
    
    ' Format the row
    FormatClientSummaryRow lastRow
    
    ' Show confirmation message
    MsgBox "WhatsApp conversation analyzed successfully. Client data added to Client_Summary sheet.", vbInformation
End Sub

' Extract client name from conversation
Function ExtractClientName(conversation As String) As String
    Dim clientName As String
    Dim pos As Long
    Dim endPos As Long
    
    ' Try to extract name from format like "5/15/25, 10:30 AM - ClientName: message"
    pos = InStr(1, conversation, " - ")
    If pos > 0 Then
        endPos = InStr(pos + 3, conversation, ":")
        If endPos > 0 Then
            clientName = Mid(conversation, pos + 3, endPos - pos - 3)
            ' Clean up the name
            clientName = Trim(clientName)
            ' Return if valid name found
            If Len(clientName) > 0 And Len(clientName) < 50 Then
                ExtractClientName = clientName
                Exit Function
            End If
        End If
    End If
    
    ' If we couldn't extract a name, use a default
    ExtractClientName = "Unknown Client"
End Function

' Generate a client ID based on name
Function GenerateClientID(clientName As String) As String
    Dim wsClients As Worksheet
    Dim lastRow As Long
    Dim nextID As Long
    
    ' Get the Client_Summary sheet
    Set wsClients = ThisWorkbook.Sheets("Client_Summary")
    
    ' Find the last used row in column A
    lastRow = wsClients.Cells(wsClients.Rows.Count, "A").End(xlUp).Row
    
    ' If there are existing client IDs, get the next number
    If lastRow > 1 Then
        ' Try to extract the number from the last client ID (format: VC001)
        On Error Resume Next
        nextID = CInt(Mid(wsClients.Cells(lastRow, 1).Value, 3)) + 1
        On Error GoTo 0
        
        ' If we couldn't extract a number, start with 1
        If nextID = 0 Then nextID = 1
    Else
        ' If no existing clients, start with 1
        nextID = 1
    End If
    
    ' Format the client ID
    GenerateClientID = "VC" & Format(nextID, "000")
End Function

' Determine client archetype based on conversation
Function DetermineArchetype(conversation As String) As String
    Dim conversation_lc As String
    conversation_lc = LCase(conversation)
    
    ' Check for Luxury Connoisseur keywords
    If InStr(1, conversation_lc, "heritage", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "craftsmanship", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "tradition", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "collection", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "history", vbTextCompare) > 0 Then
        DetermineArchetype = "Luxury Connoisseur"
        Exit Function
    End If
    
    ' Check for Status Seeker keywords
    If InStr(1, conversation_lc, "exclusive", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "status", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "recognition", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "overseas", vbTextCompare) > 0 Then
        DetermineArchetype = "Status Seeker"
        Exit Function
    End If
    
    ' Check for Value Investor keywords
    If InStr(1, conversation_lc, "investment", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "value", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "price", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "cost", vbTextCompare) > 0 Then
        DetermineArchetype = "Value Investor"
        Exit Function
    End If
    
    ' Check for Aesthetic Enthusiast keywords
    If InStr(1, conversation_lc, "design", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "beautiful", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "style", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "look", vbTextCompare) > 0 Then
        DetermineArchetype = "Aesthetic Enthusiast"
        Exit Function
    End If
    
    ' Default to Newcomer/Explorer
    DetermineArchetype = "Newcomer/Explorer"
End Function

' Detect language of conversation
Function DetectLanguage(conversation As String) As String
    Dim arabicChars As Long
    Dim englishChars As Long
    Dim i As Long
    Dim charCode As Long
    
    ' Count Arabic and English characters
    For i = 1 To Len(conversation)
        charCode = AscW(Mid(conversation, i, 1))
        
        ' Arabic Unicode range (approximate)
        If charCode >= 1536 And charCode <= 1791 Then
            arabicChars = arabicChars + 1
        ' English and common punctuation
        ElseIf (charCode >= 32 And charCode <= 126) Then
            englishChars = englishChars + 1
        End If
    Next i
    
    ' Determine primary language
    If arabicChars > englishChars * 0.5 Then
        DetectLanguage = "Arabic"
    Else
        DetectLanguage = "English"
    End If
End Function

' Analyze sentiment of conversation
Function AnalyzeSentiment(conversation As String) As Double
    Dim conversation_lc As String
    Dim score As Double
    Dim positiveWords As Variant
    Dim negativeWords As Variant
    Dim word As Variant
    
    conversation_lc = LCase(conversation)
    score = 5 ' Neutral starting point
    
    ' Define positive and negative words
    positiveWords = Array("interested", "like", "love", "amazing", "beautiful", "excellent", "perfect", "yes", "great", "wonderful", "impressive")
    negativeWords = Array("expensive", "costly", "not", "don't", "wait", "later", "think", "consider", "maybe", "problem", "issue")
    
    ' Check for positive words
    For Each word In positiveWords
        If InStr(1, conversation_lc, word, vbTextCompare) > 0 Then
            score = score + 0.5
        End If
    Next word
    
    ' Check for negative words
    For Each word In negativeWords
        If InStr(1, conversation_lc, word, vbTextCompare) > 0 Then
            score = score - 0.5
        End If
    Next word
    
    ' Ensure score is between 1 and 10
    If score < 1 Then score = 1
    If score > 10 Then score = 10
    
    AnalyzeSentiment = Round(score, 1)
End Function

' Extract interests from conversation
Function ExtractInterests(conversation As String) As String
    Dim interests As String
    Dim conversation_lc As String
    Dim collections As Variant
    Dim collection As Variant
    
    conversation_lc = LCase(conversation)
    interests = ""
    
    ' Define collections to check for
    collections = Array("overseas", "patrimony", "traditionnelle", "fiftysix", "historiques", "egerie", "metiers d'art")
    
    ' Check for each collection
    For Each collection In collections
        If InStr(1, conversation_lc, collection, vbTextCompare) > 0 Then
            If Len(interests) > 0 Then
                interests = interests & ", "
            End If
            interests = interests & UCase(Left(collection, 1)) & Mid(collection, 2)
        End If
    Next collection
    
    ' If no specific collections found
    If Len(interests) = 0 Then
        interests = "General inquiry"
    End If
    
    ExtractInterests = interests
End Function

' Extract objections from conversation
Function ExtractObjections(conversation As String) As String
    Dim objections As String
    Dim conversation_lc As String
    Dim objectionPhrases As Variant
    Dim phrase As Variant
    
    conversation_lc = LCase(conversation)
    objections = ""
    
    ' Define objection phrases to check for
    objectionPhrases = Array("too expensive", "price", "cost", "wait", "think about it", "consider", "compare", "other brands", "not sure")
    
    ' Check for each objection phrase
    For Each phrase In objectionPhrases
        If InStr(1, conversation_lc, phrase, vbTextCompare) > 0 Then
            If Len(objections) > 0 Then
                objections = objections & ", "
            End If
            objections = objections & UCase(Left(phrase, 1)) & Mid(phrase, 2)
        End If
    Next phrase
    
    ' If no specific objections found
    If Len(objections) = 0 Then
        objections = "None identified"
    End If
    
    ExtractObjections = objections
End Function

' Determine communication style based on conversation and language
Function DetermineCommunicationStyle(conversation As String, language As String) As String
    Dim conversation_lc As String
    conversation_lc = LCase(conversation)
    
    ' Check for formal language
    If InStr(1, conversation_lc, "sir", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "madam", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "please", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "thank you", vbTextCompare) > 0 Then
        DetermineCommunicationStyle = "Formal"
    ' Check for direct language
    ElseIf InStr(1, conversation_lc, "want", vbTextCompare) > 0 Or _
           InStr(1, conversation_lc, "need", vbTextCompare) > 0 Or _
           InStr(1, conversation_lc, "get", vbTextCompare) > 0 Then
        DetermineCommunicationStyle = "Direct"
    ' Check for detailed language
    ElseIf InStr(1, conversation_lc, "specification", vbTextCompare) > 0 Or _
           InStr(1, conversation_lc, "detail", vbTextCompare) > 0 Or _
           InStr(1, conversation_lc, "information", vbTextCompare) > 0 Then
        DetermineCommunicationStyle = "Detail-oriented"
    ' Default based on language
    ElseIf language = "Arabic" Then
        DetermineCommunicationStyle = "Relationship-focused"
    Else
        DetermineCommunicationStyle = "Casual"
    End If
End Function

' Determine decision factors based on conversation
Function DetermineDecisionFactors(conversation As String) As String
    Dim conversation_lc As String
    Dim factors As String
    
    conversation_lc = LCase(conversation)
    factors = ""
    
    ' Check for price sensitivity
    If InStr(1, conversation_lc, "price", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "cost", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "expensive", vbTextCompare) > 0 Then
        factors = "Price"
    End If
    
    ' Check for design focus
    If InStr(1, conversation_lc, "design", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "look", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "style", vbTextCompare) > 0 Then
        If Len(factors) > 0 Then factors = factors & ", "
        factors = factors & "Design"
    End If
    
    ' Check for heritage focus
    If InStr(1, conversation_lc, "heritage", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "history", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "tradition", vbTextCompare) > 0 Then
        If Len(factors) > 0 Then factors = factors & ", "
        factors = factors & "Heritage"
    End If
    
    ' Check for technical focus
    If InStr(1, conversation_lc, "movement", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "complication", vbTextCompare) > 0 Or _
       InStr(1, conversation_lc, "caliber", vbTextCompare) > 0 Then
        If Len(factors) > 0 Then factors = factors & ", "
        factors = factors & "Technical"
    End If
    
    ' Default if no factors identified
    If Len(factors) = 0 Then
        factors = "Undetermined"
    End If
    
    DetermineDecisionFactors = factors
End Function

' Generate recommended approach based on archetype and sentiment
Function GenerateRecommendedApproach(archetype As String, sentiment As Double) As String
    Select Case archetype
        Case "Luxury Connoisseur"
            If sentiment >= 7 Then
                GenerateRecommendedApproach = "Emphasize heritage and craftsmanship; offer private viewing"
            Else
                GenerateRecommendedApproach = "Share historical context and technical details"
            End If
        
        Case "Status Seeker"
            If sentiment >= 7 Then
                GenerateRecommendedApproach = "Highlight exclusivity and recognition value; expedite process"
            Else
                GenerateRecommendedApproach = "Emphasize limited availability and prestige positioning"
            End If
        
        Case "Value Investor"
            If sentiment >= 7 Then
                GenerateRecommendedApproach = "Discuss investment potential and long-term value"
            Else
                GenerateRecommendedApproach = "Provide comparative value analysis with other brands"
            End If
        
        Case "Aesthetic Enthusiast"
            If sentiment >= 7 Then
                GenerateRecommendedApproach = "Focus on design elements and visual appeal"
            Else
                GenerateRecommendedApproach = "Share design inspiration and artistic elements"
            End If
        
        Case "Newcomer/Explorer"
            If sentiment >= 7 Then
                GenerateRecommendedApproach = "Offer educational introduction to brand and collections"
            Else
                GenerateRecommendedApproach = "Provide entry-level options and brand overview"
            End If
        
        Case Else
            GenerateRecommendedApproach = "Build relationship and identify specific interests"
    End Select
End Function

' Format a row in the Client_Summary sheet
Sub FormatClientSummaryRow(rowNum As Long)
    Dim wsSummary As Worksheet
    Dim cell As Range
    
    ' Get the Client_Summary sheet
    Set wsSummary = ThisWorkbook.Sheets("Client_Summary")
    
    ' Apply formatting to each cell in the row
    For Each cell In wsSummary.Range(wsSummary.Cells(rowNum, 1), wsSummary.Cells(rowNum, 14))
        ' Add borders
        With cell.Borders
            .LineStyle = xlContinuous
            .Weight = xlThin
        End With
        
        ' Center align certain columns
        If cell.Column = 1 Or cell.Column = 3 Or cell.Column = 4 Or cell.Column = 5 Then
            cell.HorizontalAlignment = xlCenter
        End If
        
        ' Apply conditional formatting to sentiment score
        If cell.Column = 5 Then
            Select Case cell.Value
                Case Is >= 8
                    cell.Interior.Color = RGB(198, 239, 206) ' Green for high sentiment
                Case Is >= 5
                    cell.Interior.Color = RGB(255, 235, 156) ' Yellow for neutral sentiment
                Case Else
                    cell.Interior.Color = RGB(255, 199, 206) ' Red for low sentiment
            End Select
        End If
    Next cell
End Sub

' Worksheet_Change event to trigger parsing when text is pasted into B2
Public Sub Worksheet_Change(ByVal Target As Range)
    ' Check if the changed cell is B2 in the WhatsApp_Parser sheet
    If Target.Address = "$B$2" And Target.Worksheet.Name = "WhatsApp_Parser" Then
        ' If the cell is not empty and doesn't contain the sample text
        If Trim(Target.Value) <> "" And Target.Value <> "[Sample WhatsApp conversation will appear here when pasted]" Then
            ' Parse the conversation
            ParseWhatsAppConversation
        End If
    End If
End Sub
